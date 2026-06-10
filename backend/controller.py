from flask import request, session, jsonify
from model import app, db, User, Character, Favorite, Friend, LFGPost, UserComment, sync_api_to_db

# Configuración crucial para CORS y Cookies en desarrollo SPA
# Force reload
app.config['ENV'] = 'development'
# app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

@app.route('/api/champions', methods=['GET'])
def get_champions():
    role_filter = request.args.get('role')
    search_query = request.args.get('search')
    
    query = Character.query
    if role_filter:
        query = query.filter(Character.role.contains(role_filter.capitalize()))
    if search_query:
        query = query.filter(Character.name.contains(search_query))
    
    champions = query.all()
    data = [{
        'id': c.id,
        'name': c.name,
        'title': c.title,
        'description': c.description,
        'role': c.role,
        'image_url': c.image_url,
        'recurso': c.recurso
    } for c in champions]
    return jsonify(data)

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username'), password=data.get('password')).first()
    if user:
        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({"message": "Login exitoso", "user": {
            "id": user.id, 
            "username": user.username,
            "email": user.email,
            "riot_name": user.riot_name,
            "riot_tag": user.riot_tag,
            "profile_picture": user.profile_picture,
            "is_admin": user.is_admin
        }})
    return jsonify({"error": "Credenciales incorrectas"}), 401

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({"error": "El usuario ya existe"}), 409
        
    try:
        u = User(username=data.get('username'), password=data.get('password'))
        db.session.add(u)
        db.session.commit()
        return jsonify({"message": "Registro exitoso"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/logout', methods=['POST', 'GET'])
def logout():
    session.clear()
    return jsonify({"message": "Logout exitoso"})

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    if 'user_id' not in session:
        return jsonify({"error": "No has iniciado sesión"}), 401
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({"error": "Usuario inválido"}), 401
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "riot_name": user.riot_name,
        "riot_tag": user.riot_tag,
        "profile_picture": user.profile_picture,
        "is_admin": user.is_admin
    })

@app.route('/api/favorites', methods=['GET', 'POST'])
def handle_favorites():
    if 'user_id' not in session:
        return jsonify({"error": "No autenticado"}), 401
        
    if request.method == 'POST':
        data = request.get_json()
        champ_id = str(data.get('champ_id'))
        exists = Favorite.query.filter_by(user_id=session['user_id'], champ_id=champ_id).first()
        if not exists:
            f = Favorite(champ_id=champ_id, user_id=session['user_id'])
            db.session.add(f)
            db.session.commit()
            return jsonify({"message": "Añadido a favoritos"})
        return jsonify({"message": "Ya estaba en favoritos"})
        
    elif request.method == 'GET':
        fave_objs = Favorite.query.filter_by(user_id=session['user_id']).all()
        fave_map = {str(f.champ_id): (f.skin_num or 0) for f in fave_objs}
        fave_ids = [int(f.champ_id) for f in fave_objs]
        champions = Character.query.filter(Character.id.in_(fave_ids)).all()
        data = [{
            'id': c.id,
            'name': c.name,
            'title': c.title,
            'image_url': c.image_url,
            'role': c.role,
            'skin_num': fave_map.get(str(c.id), 0)
        } for c in champions]
        return jsonify(data)

@app.route('/api/favorites/<int:champ_id>', methods=['DELETE'])
def remove_favorite(champ_id):
    if 'user_id' not in session:
        return jsonify({"error": "No autenticado"}), 401
    fav = Favorite.query.filter_by(user_id=session['user_id'], champ_id=str(champ_id)).first()
    if fav:
        db.session.delete(fav)
        db.session.commit()
        return jsonify({"message": "Eliminado de favoritos"})
    return jsonify({"error": "No se encontró"}), 404

@app.route('/api/favorites/<int:champ_id>/skin', methods=['PUT'])
def update_favorite_skin(champ_id):
    if 'user_id' not in session:
        return jsonify({"error": "No autenticado"}), 401
    fav = Favorite.query.filter_by(user_id=session['user_id'], champ_id=str(champ_id)).first()
    if fav:
        data = request.get_json()
        fav.skin_num = data.get('skin_num', 0)
        db.session.commit()
        return jsonify({"message": "Skin actualizada", "skin_num": fav.skin_num})
    return jsonify({"error": "No encontrado"}), 404

@app.route('/api/favorites/mastery/<int:champ_id>', methods=['GET'])
def get_favorite_mastery(champ_id):
    if 'user_id' not in session:
        return jsonify({"error": "No autenticado"}), 401
        
    user = User.query.get(session['user_id'])
    if not user.riot_name or not user.riot_tag:
        return jsonify({"error": "No has vinculado tu Riot ID"}), 400
        
    from riot_api import get_puuid, get_champion_mastery
    puuid = get_puuid(user.riot_name, user.riot_tag)
    if not puuid:
        return jsonify({"error": "No se pudo resolver el Riot ID"}), 404
        
    mastery = get_champion_mastery(puuid, champ_id, user.riot_tag)
    if mastery:
        return jsonify({
            "championLevel": mastery.get("championLevel", 0),
            "championPoints": mastery.get("championPoints", 0),
        })
    
    return jsonify({"championLevel": 0, "championPoints": 0})

@app.route('/api/favorites/masteries', methods=['GET'])
def get_all_favorites_mastery():
    if 'user_id' not in session: return jsonify({}), 401
    user = User.query.get(session['user_id'])
    if not user.riot_name or not user.riot_tag: return jsonify({}), 400
    
    from riot_api import get_puuid, get_all_champion_masteries
    puuid = get_puuid(user.riot_name, user.riot_tag)
    if not puuid: return jsonify({}), 404
        
    all_masteries = get_all_champion_masteries(puuid, user.riot_tag)
    mastery_dict = {m['championId']: {"level": m['championLevel'], "points": m['championPoints']} for m in all_masteries}
    return jsonify(mastery_dict)

@app.route('/api/update-db/<lang>', methods=['POST', 'GET'])
def update_db_call(lang):
    sync_api_to_db(lang)
    return jsonify({"message": f"Base de datos actualizada en idioma: {lang}"})

@app.route('/api/match-history', methods=['POST'])
def fetch_match_history():
    data = request.get_json()
    game_name = data.get('game_name')
    tag_line = data.get('tag_line')
    
    try:
        count = int(data.get('count', 20))
        if count < 1: count = 20
        if count > 100: count = 100
    except:
        count = 20
        
    if not game_name or not tag_line:
        return jsonify({"error": "Faltan datos de Riot ID"}), 400
        
    from riot_api import get_puuid, get_matches, get_match_details, get_participant_data
    from collections import defaultdict
    
    puuid = get_puuid(game_name, tag_line)
    if not puuid:
        return jsonify({"error": "No se encontró el usuario. Verifica el Riot ID y el Tag."}), 404
        
    match_ids = get_matches(puuid, count=count)
    matches_data = []
    
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    def process_match(mid):
        details = get_match_details(mid)
        if details:
            return get_participant_data(details, puuid)
        return None

    with ThreadPoolExecutor(max_workers=6) as executor:
        future_to_mid = {executor.submit(process_match, mid): mid for mid in match_ids}
        for future in as_completed(future_to_mid):
            p_data = future.result()
            if p_data:
                matches_data.append(p_data)
                
    matches_data.sort(key=lambda m: m.get('game_timestamp', 0), reverse=True)
    
    day_stats = defaultdict(lambda: {'wins': 0, 'total': 0})
    for m in matches_data:
        d = m['game_date']
        day_stats[d]['total'] += 1
        if m['win']:
            day_stats[d]['wins'] += 1
            
    winrates = {
        d: {
            'wins': s['wins'],
            'total': s['total'],
            'pct': round(s['wins'] / s['total'] * 100)
        }
        for d, s in day_stats.items()
    }
    
    return jsonify({
        "matches": matches_data,
        "player": {'game_name': game_name, 'tag_line': tag_line},
        "winrates": winrates
    })

@app.route('/api/friends', methods=['GET', 'POST'])
def handle_friends():
    if 'user_id' not in session:
        return jsonify({"error": "No autenticado"}), 401
        
    if request.method == 'POST':
        data = request.get_json()
        name = data.get('name')
        tag = data.get('tag')
        
        if not name or not tag:
            return jsonify({"error": "Falta nombre o tag"}), 400
            
        existing = Friend.query.filter_by(user_id=session['user_id'], name=name, tag=tag).first()
        if existing:
            return jsonify({"error": "Este amigo ya está en tu lista"}), 400
            
        from riot_api import get_most_played_role
        stats = get_most_played_role(name, tag)
        if stats:
            role = stats.get('role', 'UNKNOWN').upper().strip()
            last_champ = stats.get('last_champion', 'Unknown')
            new_friend = Friend(
                user_id=session['user_id'], 
                name=name, 
                tag=tag, 
                role=role,
                last_champion=last_champ,
                profile_icon_id=stats.get('profile_icon_id', 1),
                winrate=stats.get('winrate', 0.0),
                kda=stats.get('kda', 0.0)
            )
            db.session.add(new_friend)
            db.session.commit()
            return jsonify({
                "message": "Amigo añadido", 
                "friend": {
                    "id": new_friend.id, 
                    "name": name, 
                    "tag": tag, 
                    "role": role, 
                    "last_champion": last_champ,
                    "profile_icon_id": new_friend.profile_icon_id,
                    "winrate": new_friend.winrate,
                    "kda": new_friend.kda
                }
            })
        return jsonify({"error": "No se pudo encontrar el usuario o sus partidas."}), 404
        
    elif request.method == 'GET':
        friends_list = Friend.query.filter_by(user_id=session['user_id']).all()
        data = [{
            "id": f.id,
            "name": f.name,
            "tag": f.tag,
            "role": f.role,
            "last_champion": f.last_champion,
            "profile_icon_id": f.profile_icon_id,
            "winrate": f.winrate,
            "kda": f.kda
        } for f in friends_list]
        return jsonify(data)

@app.route('/api/friends/<int:friend_id>', methods=['DELETE'])
def delete_friend_route(friend_id):
    if 'user_id' not in session:
        return jsonify({"error": "No autenticado"}), 401
    friend = Friend.query.get(friend_id)
    if friend and friend.user_id == session['user_id']:
        db.session.delete(friend)
        db.session.commit()
        return jsonify({"message": "Amigo eliminado"})
    return jsonify({"error": "No encontrado"}), 404

@app.route('/api/profile', methods=['PUT', 'DELETE'])
def handle_profile():
    if 'user_id' not in session:
        return jsonify({"error": "No autenticado"}), 401
    
    user = User.query.get(session['user_id'])
    
    if request.method == 'PUT':
        data = request.get_json()
        action = data.get('action')
        
        if action == 'update_info':
            user.username = data.get('username', user.username)
            user.riot_name = data.get('riot_name', user.riot_name)
            user.riot_tag = data.get('riot_tag', user.riot_tag)
            user.email = data.get('email', user.email)
            db.session.commit()
            return jsonify({"message": "Información actualizada"})
            
        elif action == 'change_password':
            if user.password == data.get('current_password'):
                user.password = data.get('new_password')
                db.session.commit()
                return jsonify({"message": "Contraseña cambiada exitosamente"})
            return jsonify({"error": "La contraseña actual es incorrecta"}), 401

        elif action == 'set_profile_champion':
            if data.get('champ_image'):
                user.profile_picture = data.get('champ_image')
                db.session.commit()
                return jsonify({"message": "Foto de perfil actualizada", "image": user.profile_picture})
                
        return jsonify({"error": "Acción inválida"}), 400
        
    elif request.method == 'DELETE':
        Favorite.query.filter_by(user_id=user.id).delete()
        Friend.query.filter_by(user_id=user.id).delete()
        db.session.delete(user)
        db.session.commit()
        session.clear()
        return jsonify({"message": "Cuenta eliminada permanentemente"})

@app.route('/api/profile/upload', methods=['POST'])
def upload_avatar():
    if 'user_id' not in session:
        return jsonify({"error": "No autenticado"}), 401
    
    if 'image' not in request.files:
        return jsonify({"error": "No se envió ninguna imagen"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "Archivo vacío"}), 400
        
    from werkzeug.utils import secure_filename
    import os
    from model import base_dir
    
    filename = secure_filename(f"user_{session['user_id']}_{file.filename}")
    upload_folder = os.path.join(base_dir, '../frontend/public/uploads')
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
        
    file.save(os.path.join(upload_folder, filename))
    
    user = User.query.get(session['user_id'])
    user.profile_picture = filename
    db.session.commit()
    
    return jsonify({"message": "Foto de perfil actualizada", "image": filename})

@app.route('/api/lfg', methods=['GET', 'POST'])
def handle_lfg():
    if request.method == 'GET':
        posts = LFGPost.query.order_by(LFGPost.timestamp.desc()).all()
        data = []
        for p in posts:
            user = p.user
            data.append({
                "id": p.id,
                "user_id": user.id,
                "username": user.username,
                "riot_name": user.riot_name,
                "riot_tag": user.riot_tag,
                "profile_picture": user.profile_picture,
                "role": p.role,
                "rank": p.rank,
                "message": p.message,
                "timestamp": p.timestamp.isoformat() if p.timestamp else None
            })
        return jsonify(data)
        
    elif request.method == 'POST':
        if 'user_id' not in session:
            return jsonify({"error": "No autenticado"}), 401
            
        data = request.get_json()
        role = data.get('role')
        message = data.get('message')
        
        user = User.query.get(session['user_id'])
        
        # Get rank from Riot API if linked
        rank = "UNRANKED"
        if user.riot_name and user.riot_tag:
            from riot_api import get_puuid, get_summoner_rank
            puuid = get_puuid(user.riot_name, user.riot_tag)
            if puuid:
                rank = get_summoner_rank(puuid, user.riot_tag)
                
        new_post = LFGPost(
            user_id=session['user_id'],
            role=role,
            rank=rank,
            message=message
        )
        db.session.add(new_post)
        db.session.commit()
        return jsonify({"message": "Publicación creada", "rank": rank})

@app.route('/api/lfg/<int:post_id>', methods=['DELETE'])
def delete_lfg(post_id):
    if 'user_id' not in session: return jsonify({"error": "No autenticado"}), 401
    post = LFGPost.query.get(post_id)
    if post and (post.user_id == session['user_id'] or User.query.get(session['user_id']).is_admin):
        db.session.delete(post)
        db.session.commit()
        return jsonify({"message": "Publicación eliminada"})
    return jsonify({"error": "No encontrado o sin permisos"}), 404

@app.route('/api/users/<int:target_id>', methods=['GET'])
def get_public_profile(target_id):
    user = User.query.get(target_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
        
    favorites = []
    for fav in user.favorites:
        champ = Character.query.get(int(fav.champ_id))
        if champ:
            favorites.append({
                "id": champ.id,
                "name": champ.name,
                "image_url": champ.image_url,
                "role": champ.role
            })
            
    comments = []
    for c in sorted(user.comments_received, key=lambda x: x.timestamp, reverse=True):
        comments.append({
            "id": c.id,
            "author_username": c.author.username,
            "author_id": c.author.id,
            "author_picture": c.author.profile_picture,
            "comment": c.comment,
            "is_positive": c.is_positive,
            "timestamp": c.timestamp.isoformat() if c.timestamp else None
        })
        
    positives = sum(1 for c in user.comments_received if c.is_positive)
    negatives = len(user.comments_received) - positives
        
    return jsonify({
        "id": user.id,
        "username": user.username,
        "riot_name": user.riot_name,
        "riot_tag": user.riot_tag,
        "profile_picture": user.profile_picture,
        "favorites": favorites,
        "comments": comments,
        "reputation": positives - negatives
    })

@app.route('/api/users/<int:target_id>/comments', methods=['POST'])
def add_user_comment(target_id):
    if 'user_id' not in session: return jsonify({"error": "No autenticado"}), 401
    if session['user_id'] == target_id: return jsonify({"error": "No puedes comentarte a ti mismo"}), 400
    
    target = User.query.get(target_id)
    if not target: return jsonify({"error": "Usuario no encontrado"}), 404
    
    data = request.get_json()
    comment_text = data.get('comment')
    is_positive = data.get('is_positive', True)
    
    new_comment = UserComment(
        author_id=session['user_id'],
        target_user_id=target_id,
        comment=comment_text,
        is_positive=is_positive
    )
    db.session.add(new_comment)
    db.session.commit()
    return jsonify({"message": "Comentario añadido"})

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "No autenticado"}), 401
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
            return jsonify({"error": "No tienes permisos de administrador"}), 403
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def admin_stats():
    total_users = User.query.count()
    total_favorites = Favorite.query.count()
    
    # Top campeón
    from sqlalchemy import func
    top_champ_row = db.session.query(Favorite.champ_id, func.count(Favorite.champ_id).label('total')) \
        .group_by(Favorite.champ_id).order_by(func.count(Favorite.champ_id).desc()).first()
    
    top_champ_name = "Ninguno"
    if top_champ_row:
        champ = Character.query.get(int(top_champ_row[0]))
        if champ:
            top_champ_name = champ.name
            
    return jsonify({
        "total_users": total_users,
        "total_favorites": total_favorites,
        "top_champion": top_champ_name
    })

@app.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_get_users():
    users = User.query.all()
    data = []
    for u in users:
        data.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "riot_name": u.riot_name,
            "riot_tag": u.riot_tag,
            "profile_picture": u.profile_picture,
            "is_admin": u.is_admin,
            "favorites_count": len(u.favorites)
        })
    return jsonify(data)

@app.route('/api/admin/users/<int:user_id>', methods=['PUT', 'DELETE'])
@admin_required
def admin_manage_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
        
    if request.method == 'DELETE':
        # Evitar borrarse a sí mismo
        if user_id == session['user_id']:
            return jsonify({"error": "No puedes eliminar tu propia cuenta"}), 400
            
        # Eliminar relaciones en cascada manualmente
        Favorite.query.filter_by(user_id=user.id).delete()
        Friend.query.filter_by(user_id=user.id).delete()
            
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Usuario eliminado correctamente"})
        
    elif request.method == 'PUT':
        data = request.get_json()
        
        # Validar si cambiaron el username
        new_username = data.get('username')
        if new_username and new_username != user.username:
            existing = User.query.filter_by(username=new_username).first()
            if existing:
                return jsonify({"error": "El nombre de usuario ya está en uso"}), 409
            user.username = new_username
            
        user.email = data.get('email', user.email)
        user.riot_name = data.get('riot_name', user.riot_name)
        user.riot_tag = data.get('riot_tag', user.riot_tag)
        user.profile_picture = data.get('profile_picture', user.profile_picture)
        
        if 'is_admin' in data and user_id != session['user_id']:
            user.is_admin = data['is_admin']
            
        db.session.commit()
        return jsonify({"message": "Usuario actualizado correctamente"})

# --- TEAMS / CLASH ENDPOINTS ---
from model import Team, TeamMember, TeamVacancy, TeamApplication

@app.route('/api/teams', methods=['POST'])
def create_team():
    if 'user_id' not in session: return jsonify({"error": "No autenticado"}), 401
    data = request.get_json()
    name = data.get('name')
    tag = data.get('tag')
    if not name or not tag: return jsonify({"error": "Nombre y Tag obligatorios"}), 400
    
    user = User.query.get(session['user_id'])
    if user.team_memberships:
        return jsonify({"error": "Ya perteneces a un equipo"}), 400
        
    team = Team(name=name, tag=tag, captain_id=user.id)
    db.session.add(team)
    db.session.commit() 
    
    member = TeamMember(team_id=team.id, user_id=user.id, role="CAPITAN")
    db.session.add(member)
    db.session.commit()
    
    return jsonify({"message": "Equipo creado", "team_id": team.id})

@app.route('/api/teams/my-team', methods=['GET'])
def get_my_team():
    if 'user_id' not in session: return jsonify({"error": "No autenticado"}), 401
    user = User.query.get(session['user_id'])
    
    if not user.team_memberships:
        return jsonify(None) 
        
    member = user.team_memberships[0]
    team = member.team
    
    members_data = []
    for m in team.members:
        members_data.append({
            "id": m.id,
            "user_id": m.user_id,
            "username": m.user.username,
            "profile_picture": m.user.profile_picture,
            "role": m.role,
            "riot_name": m.user.riot_name,
            "riot_tag": m.user.riot_tag
        })
        
    vacancies_data = []
    for v in team.vacancies:
        apps = []
        for a in v.applications:
            apps.append({
                "id": a.id,
                "user_id": a.user_id,
                "username": a.user.username,
                "profile_picture": a.user.profile_picture,
                "message": a.message,
                "status": a.status
            })
        vacancies_data.append({
            "id": v.id,
            "role": v.role,
            "min_rank": v.min_rank,
            "message": v.message,
            "applications": apps
        })
        
    return jsonify({
        "id": team.id,
        "name": team.name,
        "tag": team.tag,
        "captain_id": team.captain_id,
        "members": members_data,
        "vacancies": vacancies_data
    })

@app.route('/api/teams/vacancies', methods=['GET', 'POST'])
def handle_vacancies():
    if 'user_id' not in session: return jsonify({"error": "No autenticado"}), 401
    user = User.query.get(session['user_id'])
    
    if request.method == 'POST':
        data = request.get_json()
        if not user.owned_teams:
            return jsonify({"error": "No eres capitán de ningún equipo"}), 403
            
        team = user.owned_teams[0]
        if len(team.members) >= 5:
            return jsonify({"error": "El equipo ya está lleno (5/5)"}), 400
            
        role = data.get('role')
        min_rank = data.get('min_rank')
        message = data.get('message')
        
        v = TeamVacancy(team_id=team.id, role=role, min_rank=min_rank, message=message)
        db.session.add(v)
        db.session.commit()
        return jsonify({"message": "Vacante creada"})
        
    elif request.method == 'GET':
        vacancies = TeamVacancy.query.all()
        data = []
        for v in vacancies:
            team = v.team
            if len(team.members) >= 5:
                continue 
                
            data.append({
                "id": v.id,
                "team_id": team.id,
                "team_name": team.name,
                "team_tag": team.tag,
                "captain": team.captain.username,
                "role": v.role,
                "min_rank": v.min_rank,
                "message": v.message,
                "members_count": len(team.members)
            })
        return jsonify(data)

@app.route('/api/teams/vacancies/<int:vid>/apply', methods=['POST'])
def apply_vacancy(vid):
    if 'user_id' not in session: return jsonify({"error": "No autenticado"}), 401
    user = User.query.get(session['user_id'])
    
    if user.team_memberships:
        return jsonify({"error": "Ya perteneces a un equipo"}), 400
        
    v = TeamVacancy.query.get(vid)
    if not v: return jsonify({"error": "Vacante no encontrada"}), 404
    
    if len(v.team.members) >= 5:
        return jsonify({"error": "El equipo ya está lleno"}), 400
        
    existing = TeamApplication.query.filter_by(vacancy_id=vid, user_id=user.id).first()
    if existing: return jsonify({"error": "Ya has enviado una solicitud"}), 400
    
    data = request.get_json()
    msg = data.get('message', '')
    
    app_obj = TeamApplication(vacancy_id=vid, user_id=user.id, message=msg)
    db.session.add(app_obj)
    db.session.commit()
    
    return jsonify({"message": "Solicitud enviada"})

@app.route('/api/teams/applications/<int:aid>', methods=['PUT'])
def process_application(aid):
    if 'user_id' not in session: return jsonify({"error": "No autenticado"}), 401
    user = User.query.get(session['user_id'])
    
    application = TeamApplication.query.get(aid)
    if not application: return jsonify({"error": "Solicitud no encontrada"}), 404
    
    v = application.vacancy
    team = v.team
    
    if team.captain_id != user.id:
        return jsonify({"error": "Solo el capitán puede aceptar solicitudes"}), 403
        
    data = request.get_json()
    action = data.get('action') 
    
    if action == 'ACCEPT':
        if len(team.members) >= 5:
            return jsonify({"error": "El equipo ya está lleno"}), 400
            
        member = TeamMember(team_id=team.id, user_id=application.user_id, role=v.role)
        db.session.add(member)
        
        db.session.delete(v)
        
        db.session.commit()
        return jsonify({"message": "Usuario aceptado en el equipo"})
        
    elif action == 'REJECT':
        application.status = 'REJECTED'
        db.session.commit()
        return jsonify({"message": "Solicitud rechazada"})
        
    return jsonify({"error": "Acción inválida"}), 400

@app.route('/api/teams/members/<int:mid>', methods=['DELETE'])
def remove_team_member(mid):
    if 'user_id' not in session: return jsonify({"error": "No autenticado"}), 401
    user = User.query.get(session['user_id'])
    
    member = TeamMember.query.get(mid)
    if not member: return jsonify({"error": "Miembro no encontrado"}), 404
    
    team = member.team
    
    if member.user_id == user.id:
        if team.captain_id == user.id:
            return jsonify({"error": "El capitán no puede salir, debe disolver el equipo."}), 400
        db.session.delete(member)
        db.session.commit()
        return jsonify({"message": "Has abandonado el equipo"})
        
    elif team.captain_id == user.id:
        db.session.delete(member)
        db.session.commit()
        return jsonify({"message": "Miembro expulsado"})
        
    return jsonify({"error": "No tienes permisos"}), 403

@app.route('/api/teams/<int:team_id>', methods=['DELETE'])
def delete_team(team_id):
    if 'user_id' not in session: return jsonify({"error": "No autenticado"}), 401
    user = User.query.get(session['user_id'])
    
    team = Team.query.get(team_id)
    if not team: return jsonify({"error": "Equipo no encontrado"}), 404
    
    if team.captain_id != user.id:
        return jsonify({"error": "Solo el capitán puede disolver el equipo"}), 403
        
    db.session.delete(team)
    db.session.commit()
    return jsonify({"message": "Equipo disuelto correctamente"})

import os
from flask import send_from_directory

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)