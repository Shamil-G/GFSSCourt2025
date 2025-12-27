from flask import render_template, request, redirect, url_for, g, session
from main_app import app, log


@app.route('/help_fragment')
def help_fragment():
    topic = request.args.get('topic')
    log.info(f"HELP. TOPIC: {topic}")
    return render_template(f'helper/_help_{topic}.html')