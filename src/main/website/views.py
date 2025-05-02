from flask import Blueprint, request, jsonify
from .ChatApp import getReview

views = Blueprint('views', __name__)

@views.route('/')
def home():
    return 'Hello, World!'

@views.route('/get_review' )
def get_review():
    movieTitle = request.args.get('movieTitle')
    if not movieTitle:
        return jsonify({"error": "No movie title provided"}), 400
    
    #return getReview.get_review(movieTitle)
    return 'nigga'