#!/usr/bin/env python3
"""
Native messaging host for Chrome extension
Bridges the extension with Python-based poker solver
"""

import sys
import json
import struct
import logging
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, '..')

# Import our solver modules
try:
    from src.detection.universal_detector import UniversalCardDetector
    detector_available = True
except ImportError:
    detector_available = False

# Setup logging
logging.basicConfig(
    filename='poker_host.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def send_message(message):
    """Send a message to Chrome extension."""
    encoded = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()

def read_message():
    """Read a message from Chrome extension."""
    raw_length = sys.stdin.buffer.read(4)
    
    if not raw_length:
        return None
        
    message_length = struct.unpack('I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)

def analyze_hand(detection):
    """Analyze poker hand and return recommendation."""
    cards = detection.get('cards', [])
    community = detection.get('communityCards', [])
    pot = detection.get('pot')
    
    # Basic hand strength evaluation
    if len(cards) >= 2:
        # Check for pairs
        if cards[0]['rank'] == cards[1]['rank']:
            return {
                'action': 'raise',
                'amount': '3x',
                'confidence': 0.8,
                'reasoning': f"Pocket {cards[0]['rank']}s"
            }
        
        # Check for high cards
        high_cards = ['A', 'K', 'Q', 'J']
        if any(card['rank'] in high_cards for card in cards):
            return {
                'action': 'call',
                'confidence': 0.6,
                'reasoning': 'High card'
            }
    
    return {
        'action': 'fold',
        'confidence': 0.5,
        'reasoning': 'Weak hand'
    }

def main():
    """Main message loop."""
    logging.info("Poker native host started")
    
    while True:
        try:
            message = read_message()
            
            if message is None:
                break
                
            logging.debug(f"Received: {message}")
            
            if message.get('action') == 'analyze':
                detection = message.get('detection', {})
                recommendation = analyze_hand(detection)
                
                response = {
                    'type': 'recommendation',
                    'recommendation': recommendation,
                    'timestamp': datetime.now().isoformat()
                }
                
                send_message(response)
                logging.debug(f"Sent: {response}")
                
            elif message.get('action') == 'ping':
                send_message({'type': 'pong', 'status': 'ready'})
                
        except Exception as e:
            logging.error(f"Error: {e}")
            send_message({'type': 'error', 'message': str(e)})

if __name__ == '__main__':
    main()
