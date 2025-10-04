import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Авторизация пользователя через email с проверкой владельца
    Args: event - dict с httpMethod, body, queryStringParameters
          context - object с request_id, function_name
    Returns: HTTP response dict с данными пользователя и статусом владельца
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body = event.get('body', '{}')
        if not body or body == '':
            body = '{}'
        body_data = json.loads(body)
        email = body_data.get('email', '').strip().lower()
        
        if not email:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Email обязателен'}),
                'isBase64Encoded': False
            }
        
        database_url = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            "SELECT id, email, is_owner, banned, ban_reason, created_at FROM t_p25393184_voting_site_creation.users WHERE email = %s",
            (email,)
        )
        user = cursor.fetchone()
        
        if not user:
            cursor.execute(
                "INSERT INTO t_p25393184_voting_site_creation.users (email, is_owner, banned) VALUES (%s, FALSE, FALSE) RETURNING id, email, is_owner, banned, ban_reason, created_at",
                (email,)
            )
            user = cursor.fetchone()
            conn.commit()
        
        if user.get('banned', False):
            cursor.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Ваш аккаунт заблокирован',
                    'banned': True,
                    'banReason': user.get('ban_reason', 'Нарушение правил')
                }),
                'isBase64Encoded': False
            }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'id': user['id'],
                'email': user['email'],
                'isOwner': user.get('is_owner', False),
                'banned': user.get('banned', False),
                'createdAt': user['created_at'].isoformat() if user.get('created_at') else None
            }, default=str),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Метод не поддерживается'}),
        'isBase64Encoded': False
    }