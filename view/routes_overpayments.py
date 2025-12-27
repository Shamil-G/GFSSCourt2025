from flask import render_template, request, redirect, url_for, g, jsonify, session
from flask_login import login_required
from main_app import app, log
from util.i18n import get_i18n_value

from util.functions import *
from model.overpayments import *
from regions import *
from model.get_excel import get_excel


log.info("Routes-OverPayments стартовал...")

@app.route('/filter-active', methods=['GET','POST'])
@login_required
def filter_active():
    data = extract_payload()
    active = data.get('value','')

    session['active'] = active

    return redirect(url_for('filter_list_op'))


@app.route('/filter-period-overpayments', methods=['GET','POST'])
@login_required
def filter_period_list_op():
    data = extract_payload()
    period_src = data.get('value','')

    match period_src:
        case 'За месяц': period = "trunc(sysdate,'MM')"
        case 'За год': period = "add_months(trunc(sysdate,'MM'), -12)"
        case _: period = ''

    session['period_list_op'] = period
    log.info(f'filter_period_list_op. PERIOD: {period}')

    return redirect(url_for('filter_list_op'))


@app.route('/filter-iin-overpayments', methods=['GET','POST'])
@login_required
def filter_iin_list_op():
    data = extract_payload()
    iin_filter = data.get('value','')

    session['iin_filter'] = iin_filter
    log.info(f'filter_iin_list_op. IIN: {iin_filter}')
    return redirect(url_for('filter_list_op'))


@app.route('/filter-list-op')
@login_required
def filter_list_op():
    rows=[]
    iin_filter=''
    period=''

    if 'period_list_op' in session:
        period = f'{session['period_list_op']}'
    if 'iin_filter' in session:
        iin_filter=session['iin_filter']

    if 'active' not in session:
        session['active']='active'
    active=session['active']

    params = {'user_top_control': g.user.top_control, 'user_region`': g.user.dep_name, 
              'user_rfbn': g.user.rfbn_id, 'iin_filter': iin_filter, 'user_period': period, 'user_active': active
             }
    rows = list_overpayments(params)
    log.debug(f"---> FILTER_LIST_OP. Rows: {len(rows)}\n\tPARAMS {params}")
    return render_template('partials/_list_op_fragment.html', rows=rows)


@app.route('/list_op', methods=['POST', 'GET'])
@login_required
def view_list_overpayments():
    list_op=[]
    iin_filter=''

    data = extract_payload()

    iin_filter  = data.get('iin_filter','')
    order_num = data.get('order_num','')

    if 'period_list_op' not in session:
        period = " trunc(sysdate, 'MM')"
    else:
        period = f'{session['period_list_op']}'

    if 'active' not in session:
        session['active']='active'
    active=session['active']

    params = {'user_top_control': g.user.top_control, 'user_dep_name': g.user.dep_name, 'user_rfbn': g.user.rfbn_id, 'iin_filter': iin_filter, 'user_period': period, 'user_active': active}

    log.debug(f"LIST_OVERPAYMENTS. PARAMS: {params}")

    list_region = [(key, data["ldap_name"]) for key, data in regions.items()]

    log.debug(f"LIST_OVERPAYMENTS. LEN list_op: {len(list_op)}\n\tREGIONS: {list_region}")
    return render_template("list_overpayments.html", list_op=list_op, selected_order=order_num, list_region=list_region)


@app.route('/get_excel', methods=['GET'])
@login_required
def view_get_excel():
    if 'period_list_op' not in session:
        period = ""
    else:
        period = f'{session['period_list_op']}'

    params = {'user_top_control': g.user.top_control, 'user_dep_name': g.user.dep_name, 'user_rfbn': g.user.rfbn_id, 'user_period': period}

    log.info(f"--->\n\tVIEW GET EXCEL\n\tPARAMS: {params}\n<---")

    return get_excel(params)


@app.route('/add_op', methods=['POST', 'GET'])
@login_required
def view_add_op():
    mess=''
    data = extract_payload()

    region = data.get('region','')
    log.info(f'ADD_OP. CONTENT FORM: {request.form}')

    iin = data.get('iin', '')
    risk_date = data.get('risk_date','')
    rfpm_id = data.get('rfpm_id', '')
    sum_civ_amount = data.get('sum_civ_amount','')


    if iin and region:
        add_op(region, iin, risk_date, rfpm_id, sum_civ_amount)      
        return redirect(url_for('view_list_overpayments'))            
    else:
        mess = 'Не все обязательные поля заполнены'
    log.debug(f"ADD OP. REGION: {g.user.dep_name}, TTOP_CONTROL: {g.user.top_control}")
    list_region = [(key, data["ldap_name"]) for key, data in regions.items()]
    return render_template("add_op.html", region=g.user.dep_name, list_region=list_region, top_control=g.user.top_control, mess=mess)


@app.route('/form_fragment')
def pretrial_form_fragment():
    form_type = request.args.get('form')
    # order_num = request.args.get('order_num')

    log.info(f'PRETRIAL_FORM_FRAGMENT\n\tFORM_TYPE: {form_type}')

    match form_type:
        case 'pretrial':
            return render_template('partial_forms/_pretrial_form.html')
        case 'scammer':
            return render_template('partial_forms/_scammer_form.html')
        case 'law':
            return render_template('partial_forms/_law_form.html')
        case 'crime':
            return render_template('partial_forms/_court_crime_form.html')
        case 'civ':
            return render_template('partial_forms/_court_civ_form.html')
        case 'appeal':
            return render_template('partial_forms/_appeal_form.html')
        case 'execution':
            return render_template('partial_forms/_execution_form.html')
        case 'refunding':
            return render_template('partial_forms/_refunding_form.html')
        case _:
            return render_template('partial_forms/_pretrial_form.html')


@app.route('/pretrial_fragment', methods=['GET','POST'])
@login_required
def view_pretrial_fragment():
    if request.method=='POST':
        data = extract_payload()
        order_num = data.get('order_num', '')
    else:
        order_num = request.args.get('order_num','')

    pretrial_items = get_pretrial_items(order_num) if order_num else []
    log.debug(f"PRETRIAL_FRAGMENT\n\tORDER_NUM: {order_num}\n\tPRETRIAL_ITEMS: {pretrial_items}")
    return render_template("partials/_pretrial_fragment.html", pretrial_items=pretrial_items, selected_order=order_num)


@app.route('/add_pretrial', methods=['GET','POST'])
@login_required
def view_pretrial_add():
    if request.method=='POST':
        log.info(f"ADD_PRETRIAL. request.form: {request.form}")
        date_pretrial = request.form.get('agreement_date','')
        until_day = request.form.get('until_day', '')
        maturity_date = request.form.get('execution_date', '')
        order_num = request.form.get('order_num','')
    else:
        date_pretrial = request.args.get('agreement_date','')
        until_day = request.args.get('until_day', '')
        maturity_date = request.args.get('execution_date', '')
        order_num = request.args.get('order_num','')

    log.debug(f'-------------->>>\n\tADD PRETRIAL. ORDER_NUM: {order_num}\n\tUNTIL_DAY: {until_day}\n\tMATURITY_date: {maturity_date}\n\tUSER: {g.user.full_name}')
    if date_pretrial=='' or (until_day=='' and maturity_date==''):
        return { "success":  False, "message": "Не все поля заполнены:\n'Каждый месяц до' или 'Дата погашения'?" }, 200
    if order_num and g.user.full_name:
        add_pta(order_num, date_pretrial, until_day, maturity_date, g.user.full_name)      
        return { "success":  True }, 200
    # Сохраняем в БД или обрабатываем
    return { "success":  False, "message": "ADD PRETRIAL. ORDER NUM is empty?" }, 200
    # return redirect(url_for('view_list_overpayments', order_num=order_num))


@app.route('/scammer_fragment', methods=['GET','POST'])
@login_required
def view_scammer_fragment():
    if request.method=='POST':
        data = extract_payload()
        log.debug(f"REFUNDING_FRAGMENT. Data: {data}")
        order_num = data.get('order_num', '')
    else:
        order_num = request.args.get('order_num','')

    scammer_items = get_scammer_items(order_num) if order_num else []
    log.debug(f"SCAMMER_FRAGMENT\n\tORDER_NUM: {order_num}\n\tSCAMMER_ITEMS: {scammer_items}")
    return render_template("partials/_scammer_fragment.html", scammer_items=scammer_items, selected_order=order_num)


@app.route('/add_scammer', methods=['POST'])
@login_required
def view_scammer_add():
    order_num = request.form['order_num']
    iin = request.form.get('iin', '')
    scammer_org_name = request.form.get('org_name', '')
    date_notification = request.form.get('date_notification', '')
    notification = request.form.get('notification', '')

    log.info(f'----->\n\tVIEW ADD SCAMMER. ORDER_NUM: {order_num}\n\tIIN: {iin}\n\tDATE NOTIFICATION: {date_notification}\n\tNOTIFICATION: {notification}')
    log.info(f'----->\n\tVIEW ADD SCAMMER. ORDER_NUM: {order_num}\n\tIIN: {iin}\n\tSCAMMER_ORG_NAME: {scammer_org_name}<------')
    if iin=='':
        return { "success":  False, "message": "Не все поля заполнены:\nИИН ?" }, 200
    if order_num and g.user.full_name:
        add_scammer(order_num, iin, scammer_org_name, date_notification, notification, g.user.full_name)      
        return { "success":  True }, 200
    # Сохраняем в БД или обрабатываем
    return { "success":  False, "message": "VIEW ADD SCAMMER. ORDER NUM or IIN is empty?" }, 200
    # return redirect(url_for('view_list_overpayments', order_num=order_num, tab=active_tab))


@app.route('/add_law', methods=['POST'])
@login_required
def view_law_add():
    order_num = request.form.get('order_num')
    submission_date = request.form.get('submission_date','')
    decision_date = request.form.get('decision_date','')
    effective_date = request.form.get('effective_date','')

    submission_doc = request.form.get('submission_doc','')
    decision = request.form.get('decision','')
    orgname = request.form.get('orgname','')

    log.debug(f'----->\n\tADD LAW\n\tORDER_NUM: {order_num}\n\tUSER: {g.user.full_name}')
    if submission_date=='':
        log.info(f'----->\n\tADD LAW\n\tSUBMISSION_DATE and DECISION_DATE is NULL')
        return jsonify({ "success": False, "messages": ["⚠️ Вы должны не указали <Дата обращения>"] }), 200
    if order_num and g.user.full_name:
        add_law(order_num, submission_date, decision_date, effective_date, submission_doc, decision, orgname, g.user.full_name)      
        return { "success": True }, 200
    # Сохраняем в БД или обрабатываем
    return { "success":  False, "message": "Не все поля заполнены\n'Решение ПО' или 'Правоохранительный орган'?" }, 200


@app.route('/law_fragment', methods=['GET','POST'])
@login_required
def view_law_fragment():
    if request.method=='POST':
        data = extract_payload()
        log.debug(f"REFUNDING_FRAGMENT. Data: {data}")
        order_num = data.get('order_num', '')
    else:
        order_num = request.args.get('order_num','')

    law_items = get_law_items(order_num) if order_num else []
    log.debug(f"LAW_FRAGMENT\n\tORDER_NUM: {order_num}\n\tLAW_ITEMS: {law_items}")
    return render_template("partials/_law_fragment.html", law_items=law_items, selected_order=order_num)


@app.route('/add_court_crime', methods=['POST'])
@login_required
def view_court_crime_add():
    order_num = request.form.get('order_num')
    submission_date = request.form['submission_date']
    verdict_date = request.form.get('verdict_date','')
    effective_date = request.form.get('effective_date','')
    sum_civ_amount = request.form.get('sum_civ_amount','')
    compensated_amount = request.form.get('compensated_amount','')
    solution_crime_part = request.form.get('solution_crime_part','')
    solution_civ_part = request.form.get('solution_civ_part','')
    court_name = request.form.get('court_name','')

    log.debug(f'----->\n\tADD COURT\n\tORDER_NUM: {order_num}\n\tUSER: {g.user.full_name}')
    if submission_date=='':
        return jsonify({ "success": False, "messages": ["⚠️ Вы должны ввести дату в поле <Дата обращения>"] }), 200

    if order_num and g.user.full_name:
        add_crime_court(order_num, submission_date, verdict_date, effective_date, sum_civ_amount, compensated_amount, 
                        solution_crime_part, solution_civ_part, court_name, g.user.full_name)      
        return jsonify({ "success": True }), 200
    # Сохраняем в БД или обрабатываем
    return { "success":  False, "message": "ADD CRIME. ⚠️ Не все поля заполнены" }, 200


@app.route('/court_crime_fragment', methods=['GET','POST'])
@login_required
def view_court_crime_fragment():
    if request.method=='POST':
        data = extract_payload()
        log.debug(f"REFUNDING_FRAGMENT. Data: {data}")
        order_num = data.get('order_num', '')
    else:
        order_num = request.args.get('order_num','')

    court_items = get_court_crime_items(order_num) if order_num else []
    log.debug(f"COURT_FRAGMENT\n\tORDER_NUM: {order_num}\n\tLAW_ITEMS: {court_items}")
    return render_template("partials/_court_crime_fragment.html", court_crime_items=court_items, selected_order=order_num)


@app.route('/add_court_civ', methods=['POST'])
@login_required
def view_court_civ_add():
    order_num = request.form.get('order_num')
    submission_date = request.form['submission_date']
    solution_date = request.form.get('solution_date','')
    effective_date = request.form.get('effective_date','')
    num_solution = request.form.get('num_solution','')
    solution = request.form.get('solution','')
    court_name = request.form.get('court_name','')

    log.debug(f'----->\n\tADD CIV\n\tORDER_NUM: {order_num}\n\tUSER: {g.user.full_name}')
    if submission_date=='':
        log.info(f'----->\n\tADD LAW\n\tSUBMISSION_DATE and VERDICT_DATE is NULL')
        return jsonify({ "success": False, "messages": ["⚠️ Вы должны указать <Дата обращения>"] }), 200
    if solution!='' and solution_date=='':
        log.info(f'----->\n\tADD LAW\n\tDECISION and SOLUTION_DATE cant be NULL at once')
        return jsonify({ "success": False, "messages": ["⚠️ При вынесении решения должна быть указана <Дата решения>"] }), 200
    if solution_date!='':
        if solution=='' or court_name=='' or submission_date=='':
            log.info(f'----->\n\tADD LAW\n\t{get_i18n_value('MUST_BE_ALL_FIELD')}')
            return jsonify({ "success": False, "messages": [ get_i18n_value('MUST_BE_ALL_FIELD') ] }), 200
    if order_num and g.user.full_name:
        add_civ_court(order_num, submission_date, solution_date, effective_date, num_solution, solution, court_name, g.user.full_name)      
        return jsonify({ "success": True }), 200
    # Сохраняем в БД или обрабатываем
    return { "success":  False, "message": "ADD CIV. ⚠️ Не все поля заполнены" }, 200


@app.route('/court_civ_fragment', methods=['GET','POST'])
@login_required
def view_court_civ_fragment():
    if request.method=='POST':
        data = extract_payload()
        log.debug(f"REFUNDING_FRAGMENT. Data: {data}")
        order_num = data.get('order_num', '')
    else:
        order_num = request.args.get('order_num','')

    court_items = get_court_civ_items(order_num) if order_num else []
    log.debug(f"COURT_FRAGMENT\n\tORDER_NUM: {order_num}\n\tLAW_ITEMS: {court_items}")
    return render_template("partials/_court_civ_fragment.html", court_civ_items=court_items, selected_order=order_num)


@app.route('/add_appeal', methods=['POST'])
@login_required
def view_appeal_add():
    order_num = request.form.get('order_num')
    appeal_date = request.form.get('appeal_date')
    effective_date = request.form.get('effective_date','')
    appeal_solution = request.form.get('appeal_solution','')
    cassation_appeal_solution = request.form.get('cassation_appeal_solution','')
    court_name = request.form.get('court_name','')

    log.debug(f"----->\n\tADD APPEAL COURT\n\tORDER_NUM: {order_num}\n\tAPPEAL_SOLUTION: {appeal_solution}"
             f"\n\tCASSATION_APPEAL_SOLUTION: {cassation_appeal_solution}\n\tCOURT_NAME: {court_name}\n\tUSER: {g.user.full_name}")
    if order_num and g.user.full_name:
        add_appeal(order_num, appeal_date, effective_date, appeal_solution, cassation_appeal_solution, court_name, g.user.full_name)
        return jsonify({ "success": True }), 200
    # Сохраняем в БД или обрабатываем
    return jsonify({ "success": False, "message": "Поле ORDER_NUM is empty?" }), 200
    # return redirect(url_for('view_list_overpayments', order_num=order_num, tab='appeal'))


@app.route('/appeal_fragment', methods=['GET','POST'])
@login_required
def view_appeal_fragment():
    if request.method=='POST':
        data = extract_payload()
        log.debug(f"REFUNDING_FRAGMENT. Data: {data}")
        order_num = data.get('order_num', '')
    else:
        order_num = request.args.get('order_num','')

    appeal_items = get_appeal_items(order_num) if order_num else []
    log.debug(f"COURT_FRAGMENT\n\tORDER_NUM: {order_num}\n\tLAW_ITEMS: {appeal_items}")
    return render_template("partials/_appeal_fragment.html", appeal_items=appeal_items, selected_order=order_num)


@app.route('/add_execution', methods=['POST'])
@login_required
def view_execution_add():
    order_num = request.form.get('order_num')
    transfer_date = request.form.get('transfer_date','')
    start_date = request.form.get('start_date','')
    phone = request.form.get('phone','')
    court_executor = request.form.get('court_executor','')

    log.debug(f'----->\n\tADD EXECUTION\n\tORDER_NUM: {order_num}\n\tUSER: {g.user.full_name}')
    if transfer_date=='' and start_date=='':
        log.info(f'----->\n\tADD LAW\n\tTRANSFER_DATE and START_DATE is NULL')
        return jsonify({ "success": False, "messages": ["⚠️ Вы должны указать одно из двух полей:\n<Дата передачи> или <Дата исполнения>"] }), 200

    log.debug(f'----->\n\tADD EXECUTION\n\tORDER_NUM: {order_num}\n\tTRANSFER_DATE: {transfer_date}\n\tSTART_DATE: {start_date}\n\tPHONE: {phone}\n\tCOURT_EXECUTOR: {court_executor}\n\tUSER: {g.user.full_name}')
    if order_num and g.user.full_name:
        add_execution(order_num, transfer_date, start_date, phone, court_executor, g.user.full_name)      
        return { "success": True }, 200
    # Сохраняем в БД или обрабатываем
    return { "success":  False, "message": "ADD EXECUTION. ⚠️ Не все поля заполнены" }, 200


@app.route('/execution_fragment', methods=['GET','POST'])
@login_required
def view_execution_fragment():
    if request.method=='POST':
        data = extract_payload()
        log.debug(f"REFUNDING_FRAGMENT. Data: {data}")
        order_num = data.get('order_num', '')
    else:
        order_num = request.args.get('order_num','')

    execution_items = get_execution_items(order_num) if order_num else []
    log.debug(f"EXECUTION_FRAGMENT\n\tORDER_NUM: {order_num}\n\tEXECUTION_ITEMS: {execution_items}")
    return render_template("partials/_execution_fragment.html", execution_items=execution_items, selected_order=order_num)


@app.route('/recalc_refunding')
@login_required
def view_recalc_refunding():
    log.info(f'----->\n\tRECALC REFUNDING\n\tUSER: {g.user.full_name}')
    if g.user.top_control and g.user.full_name:
        recalc_refunding()
    return redirect(url_for('view_list_overpayments'))


@app.route('/refunding_fragment', methods=['GET','POST'])
@login_required
def view_refunding_fragment():
    if request.method=='POST':
        data = extract_payload()
        log.debug(f"REFUNDING_FRAGMENT. Data: {data}")
        order_num = data.get('order_num', '')
    else:
        order_num = request.args.get('order_num','')

    refunding_items = get_refunding_items(order_num) if order_num else []
    log.info(f"REFUNDING_FRAGMENT. ORDER_NUM: {order_num}\n\tREFUNDING_ITEMS: {refunding_items}")
    return render_template("partials/_refunding_fragment.html", refunding_items=refunding_items, selected_order=order_num)


@app.route('/update-field', methods=['POST'])
@login_required
def view_update_field():
    data = request.get_json()
    field = data.get('field')
    value = data.get('value')
    op_id = data.get('id')

    match field:
        case 'risk_date':
            update_risk_date(op_id, value, g.user.full_name)
        case 'sum_civ_amount':
            update_sum_civ(op_id, value, g.user.full_name)
        case 'region':
            region_name = regions[value]['ldap_name']
            update_region(op_id, value, region_name, g.user.full_name)
        case 'last_solution':
            update_last_solution(op_id, value, g.user.full_name)
        case _: log.info(f"Обновление {value} не предусмотрено")

    return { "success": True }, 200
