from flask import Flask, render_template, request
app = Flask(__name__)
import subprocess

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/speechtrack/<int:promptnum>')
def speechTrack(promptnum):
    return render_template('speechtrack.html', promptnum=promptnum)
