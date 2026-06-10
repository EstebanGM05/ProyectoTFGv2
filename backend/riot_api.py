import os
import requests
import urllib.parse
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_RIOT_KEY")
HEADERS = {
    "X-Riot-Token": API_KEY
}

# Regional routing values
REGION_ACCOUNT = "europe" 

def get_routing_region(match_id_or_platform):
    prefix = match_id_or_platform.split('_')[0].upper()
    if prefix in ['EUW1', 'EUN1', 'TR1', 'RU']: return 'europe'
    if prefix in ['NA1', 'BR1', 'LA1', 'LA2']: return 'americas'
    if prefix in ['KR', 'JP1']: return 'asia'
    if prefix in ['OC1', 'PH2', 'SG2', 'TH2', 'TW2', 'VN2']: return 'sea'
    return 'europe'

@lru_cache(maxsize=512)
def get_puuid(game_name, tag_line):
    """
    Get the PUUID for a given Riot ID (GameName#TagLine).
    Endpoint: /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}
    """
    if tag_line.startswith('#'):
        tag_line = tag_line[1:]
        
    encoded_name = urllib.parse.quote(game_name, safe='')
    encoded_tag = urllib.parse.quote(tag_line, safe='')
    
    url = f"https://{REGION_ACCOUNT}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{encoded_name}/{encoded_tag}"
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code == 200:
        return response.json().get("puuid")
    return None

def get_platform_routing(tag_line):
    if tag_line.startswith('#'):
        tag_line = tag_line[1:]
    t = tag_line.upper()
    if t in ['EUW', 'EUW1']: return 'euw1'
    if t in ['NA', 'NA1']: return 'na1'
    if t in ['EUNE', 'EUN1']: return 'eun1'
    if t in ['KR', 'KR1']: return 'kr'
    if t in ['BR', 'BR1']: return 'br1'
    if t in ['LAN', 'LA1']: return 'la1'
    if t in ['LAS', 'LA2']: return 'la2'
    if t in ['OCE', 'OC1']: return 'oc1'
    if t in ['TR', 'TR1']: return 'tr1'
    if t in ['RU']: return 'ru'
    if t in ['JP', 'JP1']: return 'jp1'
    return 'euw1' # Fallback

@lru_cache(maxsize=512)
def get_summoner_rank(puuid, tag_line="EUW"):
    """
    Get the highest rank (Solo/Duo or Flex) for a given PUUID.
    Requires an extra step to get the summonerId first.
    """
    platform = get_platform_routing(tag_line)
    
    # 1. Get Summoner ID from PUUID
    summoner_url = f"https://{platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}"
    sum_resp = requests.get(summoner_url, headers=HEADERS)
    if sum_resp.status_code != 200:
        return "UNRANKED"
        
    summoner_id = sum_resp.json().get("id")
    if not summoner_id:
        return "UNRANKED"
        
    # 2. Get League Entries
    league_url = f"https://{platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/{summoner_id}"
    league_resp = requests.get(league_url, headers=HEADERS)
    
    if league_resp.status_code == 200:
        entries = league_resp.json()
        if not entries:
            return "UNRANKED"
            
        # Prioritize Solo/Duo queue
        solo_q = next((e for e in entries if e.get("queueType") == "RANKED_SOLO_5x5"), None)
        if solo_q:
            return f"{solo_q.get('tier')} {solo_q.get('rank')}"
            
        # Fallback to any other queue
        return f"{entries[0].get('tier')} {entries[0].get('rank')}"
        
    return "UNRANKED"

@lru_cache(maxsize=1024)
def get_champion_mastery(puuid, champion_id, tag_line="EUW"):
    """
    Get mastery for a specific champion.
    """
    platform = get_platform_routing(tag_line)
    url = f"https://{platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}/by-champion/{champion_id}"
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code == 200:
        return response.json()
    return None

@lru_cache(maxsize=512)
def get_all_champion_masteries(puuid, tag_line="EUW"):
    platform = get_platform_routing(tag_line)
    url = f"https://{platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    return []

def get_matches(puuid, count=10):
    """
    Get a list of match IDs for a given PUUID across all regions.
    """
    regions = ['europe', 'americas', 'asia', 'sea']
    for reg in regions:
        url = f"https://{reg}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count={count}"
        response = requests.get(url, headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            if len(data) > 0: return data
    
    # If all regions fail or return 0, fallback empty
    return []

@lru_cache(maxsize=512)
def get_match_details(match_id):
    """
    Get details for a specific match ID tracking its proper routing region.
    """
    reg = get_routing_region(match_id)
    url = f"https://{reg}.api.riotgames.com/lol/match/v5/matches/{match_id}"
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code == 200:
        return response.json()
    return None

def get_participant_data(match_data, puuid):
    """
    Extract relevant data for the specific player (PUUID) from the match data.
    Returns a dictionary with: championName, kills, deaths, assists, win (bool), kda (formatted string).
    """
    info = match_data.get("info", {})
    participants = info.get("participants", [])
    
    for p in participants:
        if p.get("puuid") == puuid:
            kills = p.get("kills", 0)
            deaths = p.get("deaths", 0)
            assists = p.get("assists", 0)
            win = p.get("win", False)
            champion_name = p.get("championName", "Unknown")
            
            if deaths == 0:
                kda_value = kills + assists
            else:
                kda_value = (kills + assists) / deaths
            
            cs = p.get("totalMinionsKilled", 0) + p.get("neutralMinionsKilled", 0)
            gold = p.get("goldEarned", 0)
            damage_turrets = p.get("damageDealtToTurrets", 0)
            turret_kills = p.get("turretKills", 0)
            vision_score = p.get("visionScore", 0)
            total_damage = p.get("totalDamageDealtToChampions", 0)
            penta_kills = p.get("pentaKills", 0)
            first_blood = p.get("firstBloodKill", False)
            player_party_id = p.get("partyId")
            items = [p.get(f"item{i}", 0) for i in range(7)]
            
            # Medals Logic
            medals = []
            # Performance
            if kills > 9: medals.append("Killer")
            if deaths > 9: medals.append("Feeder")
            if assists > 12: medals.append("Asistente")
            if cs > 150: medals.append("Farmeador")
            if damage_turrets > 2000: medals.append("Destructor")
            
            # New Medals
            if penta_kills > 0: medals.append("Pentakill")
            if first_blood: medals.append("PrimeraSangre")
            if total_damage > 25000: medals.append("Carry")
            if vision_score > 30: medals.append("Visionario")
            if deaths < 3 and info.get("gameDuration", 0) > 600: medals.append("Inmortal")

            # Team processing
            teams_map = {}
            game_mode = info.get("gameMode", "")
            is_arena = game_mode == "CHERRY"

            for teammate in participants:
                if is_arena:
                    group_id = teammate.get("placement", 99)
                else:
                    group_id = teammate.get("teamId", 0)



                if group_id not in teams_map:
                    teams_map[group_id] = []
                
                # Get name & tag
                t_name = teammate.get("riotIdGameName", "")
                t_tag = teammate.get("riotIdTagline", "")
                t_champ = teammate.get("championName", "Unknown")

                if not t_name:
                    t_name = teammate.get("summonerName", "Unknown") # Fallback
                
                t_kills = teammate.get("kills", 0)
                t_deaths = teammate.get("deaths", 0)
                t_assists = teammate.get("assists", 0)
                t_gold = teammate.get("goldEarned", 0)
                t_damage = teammate.get("totalDamageDealtToChampions", 0)
                t_items = [teammate.get(f"item{i}", 0) for i in range(7)]
                
                # Calculate KDA
                if t_deaths == 0:
                    t_kda = float(t_kills + t_assists)
                else:
                    t_kda = (t_kills + t_assists) / t_deaths
                
                game_duration_min = info.get("gameDuration", 0) / 60.0
                if game_duration_min > 0:
                    t_gpm = t_gold / game_duration_min
                else:
                    t_gpm = 0

                # Store object instead of string
                teams_map[group_id].append({
                    "name": t_name,
                    "tag": t_tag,
                    "champion": t_champ,
                    "kills": t_kills,
                    "deaths": t_deaths,
                    "assists": t_assists,
                    "kda": f"{t_kda:.2f}",
                    "gold": t_gold,
                    "gpm": f"{t_gpm:.1f}",
                    "damage": t_damage,
                    "items": t_items
                })

            # Assign colors
            sorted_group_ids = sorted(teams_map.keys())
            teams_data = []
            
            # Colors for Arena (ordered by placement 1st to 8th)
            arena_colors = [
                "pool-yellow", "pool-blue", "pool-red", "pool-green", 
                "pool-orange", "pool-purple", "pool-pink", "pool-aquamarine"
            ]
            
            for index, gid in enumerate(sorted_group_ids):
                # Determine color class
                color_class = "team-gray"
                
                if is_arena:
                    # Map placement to colors
                    color_index = index % len(arena_colors)
                    color_class = arena_colors[color_index]
                    team_label = f"Top {gid}" 
                    objectives = {} # Arena doesn't have standard team objectives in the same way
                else:
                    # Classic Team IDs
                    team_obj_data = {}
                    # Find team stats in info['teams']
                    teams_info = info.get("teams", [])
                    for t_info in teams_info:
                        if t_info.get("teamId") == gid:
                            obj = t_info.get("objectives", {})
                            team_obj_data = {
                                "baron": obj.get("baron", {}).get("kills", 0),
                                "dragon": obj.get("dragon", {}).get("kills", 0),
                                "horde": obj.get("horde", {}).get("kills", 0), # Void Grubs / Kevins
                                "riftHerald": obj.get("riftHerald", {}).get("kills", 0),
                                "tower": obj.get("tower", {}).get("kills", 0)
                            }
                            break
                    
                    objectives = team_obj_data

                    if gid == 100:
                        color_class = "team-blue"
                        team_label = "Equipo Azul"
                    elif gid == 200:
                        color_class = "team-red"
                        team_label = "Equipo Rojo"
                    else:
                        team_label = f"Equipo {gid}"

                team_kills = sum(p.get("kills", 0) for p in teams_map[gid])

                teams_data.append({
                    "id": team_label,
                    "color_class": color_class,
                    "players": teams_map[gid],
                    "objectives": objectives,
                    "total_kills": team_kills
                })

            return {
                "championName": champion_name,
                "kills": kills,
                "deaths": deaths,
                "assists": assists,
                "win": win,
                "kda": f"{kda_value:.2f}",
                "gameMode": game_mode,
                "gameDuration": info.get("gameDuration", 0),
                "game_timestamp": info.get("gameCreation", 0),
                "game_date": __import__('datetime').datetime.fromtimestamp(
                    info.get("gameCreation", 0) / 1000
                ).strftime("%Y-%m-%d") if info.get("gameCreation") else "Desconocido",
                "game_date_display": __import__('datetime').datetime.fromtimestamp(
                    info.get("gameCreation", 0) / 1000
                ).strftime("%d/%m/%Y") if info.get("gameCreation") else "Desconocido",
                "cs": cs,
                "gold": gold,
                "turrets": turret_kills,
                "medals": medals,
                "items": items,
                "teams": teams_data
            }
    return None

def get_most_played_role(game_name, tag_line):
    """
    Determines the most played role for a user based on their last 20 matches,
    and also calculates winrate, KDA and extracts their profile icon.
    """
    puuid = get_puuid(game_name, tag_line)
    if not puuid:
        return None
    
    match_ids = get_matches(puuid, count=20)
    if not match_ids:
        return {"role": "UNKNOWN", "last_champion": "Unknown", "profile_icon_id": 1, "winrate": 0.0, "kda": 0.0}
        
    from concurrent.futures import ThreadPoolExecutor
    
    def process_role(mid):
        details = get_match_details(mid)
        if not details: return None
        
        info = details.get("info", {})
        for p in info.get("participants", []):
            if p.get("puuid") == puuid:
                pos = p.get("teamPosition") or p.get("individualPosition") or "UNKNOWN"
                if pos == "": pos = "UNKNOWN"
                
                champ = p.get("championName", "Unknown")
                win = p.get("win", False)
                kills = p.get("kills", 0)
                deaths = p.get("deaths", 0)
                assists = p.get("assists", 0)
                icon = p.get("profileIcon", 1)
                
                return {
                    "mid": mid,
                    "pos": pos,
                    "champ": champ,
                    "win": win,
                    "kills": kills,
                    "deaths": deaths,
                    "assists": assists,
                    "icon": icon
                }
        return None

    roles = []
    last_champion = "Unknown"
    profile_icon_id = 1
    total_wins = 0
    total_kills = 0
    total_deaths = 0
    total_assists = 0
    valid_matches = 0
    
    with ThreadPoolExecutor(max_workers=6) as executor:
        results = list(executor.map(process_role, match_ids))
        
    for r in results:
        if r:
            roles.append(r["pos"])
            if r["mid"] == match_ids[0]:
                last_champion = r["champ"]
                profile_icon_id = r["icon"]
            
            if r["win"]: total_wins += 1
            total_kills += r["kills"]
            total_deaths += r["deaths"]
            total_assists += r["assists"]
            valid_matches += 1

    if not roles:
        return {"role": "UNKNOWN", "last_champion": last_champion, "profile_icon_id": profile_icon_id, "winrate": 0.0, "kda": 0.0}
        
    # Count most frequent role
    from collections import Counter
    most_common = Counter(roles).most_common(1)
    
    role = most_common[0][0] if most_common else "UNKNOWN"
    if role == "UNKNOWN" and last_champion != "Unknown":
        role = "Cualquiera"
        
    winrate = (total_wins / valid_matches * 100) if valid_matches > 0 else 0.0
    kda = (total_kills + total_assists) / total_deaths if total_deaths > 0 else float(total_kills + total_assists)
        
    return {
        "role": role, 
        "last_champion": last_champion,
        "profile_icon_id": profile_icon_id,
        "winrate": round(winrate, 1),
        "kda": round(kda, 2)
    }
