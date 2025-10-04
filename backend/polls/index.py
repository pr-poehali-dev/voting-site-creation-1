import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление голосованиями (создание, получение, голосование)
    Args: event - dict с httpMethod, body, queryStringParameters
          context - object с request_id, function_name
    Returns: HTTP response dict с данными голосований
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    if method == 'GET':
        cur.execute("""
            SELECT p.id, p.title, p.description, p.status, p.end_date,
                   po.id, po.option_text, po.votes
            FROM polls p
            LEFT JOIN poll_options po ON p.id = po.poll_id
            ORDER BY p.created_at DESC, po.id
        """)
        rows = cur.fetchall()
        
        polls_dict = {}
        for row in rows:
            poll_id = row[0]
            if poll_id not in polls_dict:
                polls_dict[poll_id] = {
                    'id': str(poll_id),
                    'title': row[1],
                    'description': row[2],
                    'status': row[3],
                    'endDate': str(row[4]) if row[4] else None,
                    'options': [],
                    'totalVotes': 0
                }
            if row[5]:
                option = {'id': str(row[5]), 'text': row[6], 'votes': row[7]}
                polls_dict[poll_id]['options'].append(option)
                polls_dict[poll_id]['totalVotes'] += row[7]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'polls': list(polls_dict.values())})
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        title = body_data.get('title')
        description = body_data.get('description', '')
        options = body_data.get('options', [])
        user_id = body_data.get('user_id')
        end_date = body_data.get('end_date')
        
        cur.execute(
            "INSERT INTO polls (title, description, created_by, end_date) VALUES (%s, %s, %s, %s) RETURNING id",
            (title, description, user_id, end_date)
        )
        poll_id = cur.fetchone()[0]
        
        for option in options:
            cur.execute(
                "INSERT INTO poll_options (poll_id, option_text) VALUES (%s, %s)",
                (poll_id, option)
            )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'poll_id': poll_id, 'message': 'Poll created'})
        }
    
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        user_id = body_data.get('user_id')
        poll_id = body_data.get('poll_id')
        option_id = body_data.get('option_id')
        
        cur.execute(
            "SELECT COUNT(*) FROM user_votes WHERE user_id = %s AND poll_id = %s",
            (user_id, poll_id)
        )
        already_voted = cur.fetchone()[0] > 0
        
        if already_voted:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Already voted'})
            }
        
        cur.execute(
            "INSERT INTO user_votes (user_id, poll_id, option_id) VALUES (%s, %s, %s)",
            (user_id, poll_id, option_id)
        )
        cur.execute(
            "UPDATE poll_options SET votes = votes + 1 WHERE id = %s",
            (option_id,)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Vote recorded'})
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
