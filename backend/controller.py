from flask import request, session, jsonify
from model import app, db, User, Character, Favorite, Friend, sync_api_to_db

# Configuración crucial para CORS y Cookies en desarrollo SPA
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
        return jsonify({"message": "Login exitoso", "user": {"id": user.id, "username": user.username}})
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
        "profile_picture": user.profile_picture
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
        fave_ids = [int(f.champ_id) for f in fave_objs]
        champions = Character.query.filter(Character.id.in_(fave_ids)).all()
        data = [{
            'id': c.id,
            'name': c.name,
            'title': c.title,
            'image_url': c.image_url,
            'role': c.role
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

@app.route('/api/update-db/<lang>', methods=['POST', 'GET'])
def update_db_call(lang):
    sync_api_to_db(lang)
    return jsonify({"message": f"Base de datos actualizada en idioma: {lang}"})

@app.route('/api/match-history', methods=['POST'])
def fetch_match_history():
    data = request.get_json()
    game_name = data.get('game_name')
    tag_line = data.get('tag_line')
    
    if not game_name or not tag_line:
        return jsonify({"error": "Faltan datos de Riot ID"}), 400
        
    from riot_api import get_puuid, get_matches, get_match_details, get_participant_data
    from collections import defaultdict
    
    puuid = get_puuid(game_name, tag_line)
    if not puuid:
        return jsonify({"error": "No se encontró el usuario. Verifica el Riot ID y el Tag."}), 404
        
    match_ids = get_matches(puuid, count=30)
    matches_data = []
    for mid in match_ids:
        details = get_match_details(mid)
        if details:
            p_data = get_participant_data(details, puuid)
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
                last_champion=last_champ
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
                    "last_champion": last_champ
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
            "last_champion": f.last_champion
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)