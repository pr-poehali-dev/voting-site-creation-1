'''
Business: Управление пользователями и их ролями
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с attributes: request_id, function_name
Returns: HTTP response dict со списком пользователей или результатом обновления
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    if method == 'GET':
        cursor.execute(
            "SELECT id, email, role, is_owner, created_at FROM t_p25393184_voting_site_creation.users ORDER BY created_at DESC"
        )
        users = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        users_list = []
        for user in users:
            users_list.append({
                'id': user['id'],
                'email': user['email'],
                'role': user.get('role', 'user'),
                'isOwner': user.get('is_owner', False),
                'createdAt': user['created_at'].isoformat() if user.get('created_at') else None
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'users': users_list}, default=str),
            'isBase64Encoded': False
        }
    
    if method == 'PATCH':
        body_data = json.loads(event.get('body', '{}'))
        user_id = body_data.get('user_id')
        new_role = body_data.get('role')
        
        if not user_id or not new_role:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'user_id и role обязательны'}),
                'isBase64Encoded': False
            }
        
        cursor.execute(
            "UPDATE t_p25393184_voting_site_creation.users SET role = %s WHERE id = %s RETURNING id, email, role",
            (new_role, user_id)
        )
        updated_user = cursor.fetchone()
        conn.commit()
        
        cursor.close()
        conn.close()
        
        if not updated_user:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Пользователь не найден'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'id': updated_user['id'],
                'email': updated_user['email'],
                'role': updated_user['role']
            }),
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
