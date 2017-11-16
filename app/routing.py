from flask import Flask, render_template, request
app = Flask(__name__)
import subprocess

@app.route('/')
def index():
    return render_template('speechtrack.html')


customGraphPrompt = "/opt/kaldi/egs/digitala/s5/data/isdemo17/custom/prompt.txt"
createCustomGraphCMD = "./refreshCustomGraph.sh"

@app.route('/custom-graph', methods=['POST'])
def createCustomGraph():
    text_to_read = request.form['text']
    app.logger.info("Creating graph with text:" + text_to_read)
    with open(customGraphPrompt, "w") as fo:
        fo.write(text_to_read.encode('utf8'))
    try:
        subprocess.check_call(createCustomGraphCMD)
        return "OK"
    except subprocess.CalledProcessError:
        return "FAILED"
