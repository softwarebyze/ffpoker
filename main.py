import requests
from bs4 import BeautifulSoup
import pandas as pd

# Mapping of team abbreviations to full team names
team_names = {
    "ARI": "Arizona Cardinals",
    "ATL": "Atlanta Falcons",
    "BAL": "Baltimore Ravens",
    "BUF": "Buffalo Bills",
    "CAR": "Carolina Panthers",
    "CHI": "Chicago Bears",
    "CIN": "Cincinnati Bengals",
    "CLE": "Cleveland Browns",
    "DAL": "Dallas Cowboys",
    "DEN": "Denver Broncos",
    "DET": "Detroit Lions",
    "GB": "Green Bay Packers",
    "HOU": "Houston Texans",
    "IND": "Indianapolis Colts",
    "JAX": "Jacksonville Jaguars",
    "KC": "Kansas City Chiefs",
    "LV": "Las Vegas Raiders",
    "LAC": "Los Angeles Chargers",
    "LAR": "Los Angeles Rams",
    "MIA": "Miami Dolphins",
    "MIN": "Minnesota Vikings",
    "NE": "New England Patriots",
    "NO": "New Orleans Saints",
    "NYG": "New York Giants",
    "NYJ": "New York Jets",
    "PHI": "Philadelphia Eagles",
    "PIT": "Pittsburgh Steelers",
    "SEA": "Seattle Seahawks",
    "SF": "San Francisco 49ers",
    "TB": "Tampa Bay Buccaneers",
    "TEN": "Tennessee Titans",
    "WAS": "Washington Commanders"
}

# Initialize a dictionary to hold data for all teams and positions
team_data = {team: {"QB": "", "QB Points": float('-inf'),
                    "RB": "", "RB Points": float('-inf'),
                    "WR": "", "WR Points": float('-inf'),
                    "TE": "", "TE Points": float('-inf'),
                    "K": "", "K Points": float('-inf'),
                    "Defense": "", "Defense Points": float('-inf')}
             for team in team_names.values()}

def fetch_fantasy_points(url, position, DST=False):
    try:
        # Fetch the webpage's HTML
        response = requests.get(url)
        response.raise_for_status()
        html = response.text

        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')

        # Find all rows in the table (assumed structure)
        rows = soup.select('table tbody tr')

        for row in rows:
            try:
                # Extract the player's team
                team_abbr = row.select_one('a.special').get_text(strip=True)
                full_team_name = team_names.get(team_abbr, team_abbr)

                # For DST, we only need the team name and points, no player name
                if DST:
                    fantasy_points = row.select_one('td.sorted').get_text(strip=True)
                    fantasy_points = parse_fantasy_points(fantasy_points)

                    if fantasy_points > team_data[full_team_name]["Defense Points"]:
                        team_data[full_team_name]["Defense"] = full_team_name + " Defense"
                        team_data[full_team_name]["Defense Points"] = fantasy_points
                else:
                    # Extract the player's name for non-DST positions
                    player_name = row.select_one('td.sticky.special.text-start a').get_text(strip=True)
                    fantasy_points = row.select_one('td.sorted').get_text(strip=True)
                    fantasy_points = parse_fantasy_points(fantasy_points)

                    # Logging for debugging
                    print(f"Team: {full_team_name}, Player: {player_name}, Points: {fantasy_points}")

                    # Assign the player and points to the correct team and position in the team_data dictionary
                    if fantasy_points > team_data[full_team_name][f"{position} Points"]:
                        team_data[full_team_name][position] = player_name
                        team_data[full_team_name][f"{position} Points"] = fantasy_points

            except AttributeError as e:
                # Handle cases where intermediate data is missing, skipping incomplete rows
                print(f"Skipping incomplete data row in {position}: {e}")
                continue

    except requests.exceptions.RequestException as e:
        print(f'Failed to fetch fantasy points for {position}:', e)

# Helper function to handle negative and comma-formatted numbers
def parse_fantasy_points(points_str):
    try:
        # Remove any extraneous characters like commas, spaces, or newline characters
        points_str = points_str.replace(',', '').strip()

        # Check for negative values and ensure proper conversion
        return float(points_str)
    except ValueError:
        print(f"Error parsing fantasy points: {points_str}")
        return float('-inf')  # Use -inf as default to handle comparison logic

# URLs for different positions
urls = {
    'QB': 'https://fantasydata.com/nfl/fantasy-football-leaders?scope=game&position=qb&scoring=fpts_ppr&order_by=fpts_ppr&sort_dir=desc',
    'RB': 'https://fantasydata.com/nfl/fantasy-football-leaders?scope=game&position=rb&scoring=fpts_ppr&order_by=fpts_ppr&sort_dir=desc',
    'WR': 'https://fantasydata.com/nfl/fantasy-football-leaders?scope=game&position=wr&scoring=fpts_ppr&order_by=fpts_ppr&sort_dir=desc',
    'TE': 'https://fantasydata.com/nfl/fantasy-football-leaders?scope=game&position=te&scoring=fpts_ppr&order_by=fpts_ppr&sort_dir=desc',
    'K': 'https://fantasydata.com/nfl/fantasy-football-leaders?scope=game&position=k&scoring=fpts_ppr&order_by=fpts_ppr&sort_dir=desc',
    'DST': 'https://fantasydata.com/nfl/fantasy-football-leaders?scope=game&position=dst&scoring=fpts_ppr&order_by=fpts_ppr&sort_dir=desc'
}

# Fetch data for each position
for position, url in urls.items():
    fetch_fantasy_points(url, position if position != "DST" else "Defense", DST=(position == "DST"))

# Convert the team_data dictionary into a DataFrame
df = pd.DataFrame.from_dict(team_data, orient='index').reset_index().rename(columns={'index': 'Team'})

# Display the DataFrame
print(df)

# Save to CSV
df.to_csv("nfl_rosters_2024.csv", index=False)
