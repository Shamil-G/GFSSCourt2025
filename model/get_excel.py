from model.overpayments import stmt_list_op_orig
from main_app import log
from db.connect import get_connection, oracledb
import datetime
import pandas as pd
from flask import Response
import urllib.parse
import io
from decimal import Decimal, ROUND_HALF_UP


report_name = 'Претензионная судебная работа'
report_code = 'ПСР'


def get_stmt(args: dict) -> str:
	stmt=stmt_list_op_orig

	user_top_control = args.get('user_top_control', None)
	user_period = args.get('user_period', None)
	user_region = args.get('user_region', None)

	if not user_top_control:   
		stmt = stmt + f'and op.region={user_region}'
	if user_period:
		stmt = stmt + f'and op.risk_date>={user_period}'
	stmt = stmt + '\norder by op.region, verdict_date'

	return stmt



def export_to_excel(df_pivot, columns, args, filename=f"rep_{report_code}.xlsx"):
	s_date = datetime.datetime.now().strftime("%H:%M:%S")
	output = io.BytesIO()
	with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
		df = df_pivot.copy()
		df = df.fillna("")
		# df.to_excel(writer, sheet_name="Отчёт", index=False, startrow=4, header=False)

		workbook  = writer.book

		worksheet = workbook.add_worksheet('Отчёт')
		sql_sheet = workbook.add_worksheet('SQL')

		merge_format = workbook.add_format({
			'bold':     False,
			'border':   6,
			'align':    'left',
			'valign':   'vcenter',
			'fg_color': '#FAFAD7',
			'text_wrap': True
		})
		sql_sheet.merge_range('A1:I20', f'{get_stmt(args)}', merge_format)        
		worksheet.activate()
		
		# date_fmt = workbook.add_format({"num_format": "dd.mm.yyyy", "align": "center", "valign": "vcenter", "border": 1})
		title_name_report = workbook.add_format({'align': 'left', 'font_color': 'black', 'font_size': '14', "valign": "vcenter", "bold": True})

		money_fmt = workbook.add_format({"num_format": "# ### ### ##0.00", "align": "right", "valign": "vcenter", "border": 1})
		count_fmt = workbook.add_format({"num_format": "# ### ### ##0", "align": "center", "valign": "vcenter", "border": 1})
		text_fmt = workbook.add_format({"align": "left", "border": 1})
		text_center_fmt = workbook.add_format({"align": "center", "border": 1})

		header_fmt = workbook.add_format({"bold": True, "align": "center", "valign": "vcenter", "border": 1, "text_wrap": True, 'bg_color': '#D1FFFF'}) # Голубой
		subheader_fmt = workbook.add_format({"align": "center", "valign": "vcenter", "border": 1, 'bg_color': '#D1FFFF'}) # 'fg_color': '#FAFAD7' - желтый
		title_report_code = workbook.add_format({'align': 'right', 'font_size': '14', "valign": "vcenter", "bold": True})
		footer_fmt = workbook.add_format({'align': 'right', "valign": "vcenter", "italic": True}) # золотой фон
		
		worksheet.set_row(0, 24)
		worksheet.write(0, 0, report_name, title_name_report)
		worksheet.write(0, 6, report_code, title_report_code)

		# Заголовки first_row, first_col, last_row, last_col, data, cell_format
		worksheet.set_column(0, 0, 12)
		col_idx = 0
		# Шапка
		for i, col in enumerate(columns):
			worksheet.write(2, i, col, header_fmt)
			match col:
				case 'номер': worksheet.set_column(col_idx+i, col_idx+i, 10)
				case 'регион': worksheet.set_column(col_idx+i, col_idx+i, 40)
				case 'фио': worksheet.set_column(col_idx+i, col_idx+i, 40)
				case 'сумма задолженности': worksheet.set_column(col_idx+i, col_idx+i, 16)
				case 'возвращенная сумма': worksheet.set_column(col_idx+i, col_idx+i, 16)
				case 'орган принятия последнего решения': worksheet.set_column(col_idx+i, col_idx+i, 32)
				case 'последнее решение': worksheet.set_column(col_idx+i, col_idx+i, 32)
				case 'сотрудник фонда': worksheet.set_column(col_idx+i, col_idx+i, 32)
				case 'текущий статус': worksheet.set_column(col_idx+i, col_idx+i, 24)
				case _: worksheet.set_column(col_idx+i, col_idx+i, 14)

		row_start = 3  # первая строка после шапки
		row_num = 0
		for row_num, (_, record) in enumerate(df.iterrows()):
			col_idx = 0
			for col in columns:
				value = record[col]
				# если в SQL ты уже сделал красивые имена, то metric можно брать напрямую
				match col:
					case "номер": worksheet.write(row_start + row_num, col_idx, value, count_fmt)
					case "регион": worksheet.write(row_start + row_num, col_idx, value, text_fmt)
					case "фио": worksheet.write(row_start + row_num, col_idx, value, text_fmt)
					case "текущий статус": worksheet.write(row_start + row_num, col_idx, value, text_fmt)
					case "орган принятия последнего решения": worksheet.write(row_start + row_num, col_idx, value, text_fmt)
					case "последнее решение": worksheet.write(row_start + row_num, col_idx, value, text_fmt)
					case "сотрудник фонда": worksheet.write(row_start + row_num, col_idx, value, text_fmt)
					case "сумма задолженности": 
						num = Decimal(value).quantize(Decimal("0.00"), rounding=ROUND_HALF_UP) 
						worksheet.write(row_start + row_num, col_idx, num, money_fmt)
					case "возвращенная сумма":   
						num = Decimal(value).quantize(Decimal("0.00"), rounding=ROUND_HALF_UP) 
						worksheet.write(row_start + row_num, col_idx, num, money_fmt)
					case _: worksheet.write(row_start + row_num, col_idx, value, text_center_fmt)
				col_idx += 1



		now = datetime.datetime.now()
		stop_time = now.strftime("%H:%M:%S")

		worksheet.write(1, 6, f'Дата формирования: {now.strftime("%d.%m.%Y ")}({s_date} - {stop_time})', footer_fmt)

		# Заморозим 4 строку и 1 колонку
		worksheet.freeze_panes(3, 1)
		# курсор в пределах таблицы
		worksheet.set_selection(0, 0, row_start+row_num+1, col_idx)

	log.info(f'REPORT: {report_code}. Формирование отчета {filename} завершено ({s_date} - {stop_time}). Строк в отчете: {row_num+1}')

	safe_filename = urllib.parse.quote(filename)

	excel_bytes = output.getvalue()
	return Response(
		excel_bytes,
		mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		headers={"Content-Disposition": f"attachment; filename*=UTF-8''{safe_filename}"}
	)

# Не используется!
def sort_rename(df):
	# Сортировка строк по birth_year, если колонка есть
	if "Регион" in df.columns:
		df = df.sort_values(by="Регион")

	# Красивые имена колонок
	df.rename(columns={
		'region': 'Регион',
		'fio': 'ФИО',
		'iin': 'ИИН',
		'verdict_date': 'Дата задолженности',
		'sum_civ_amount': 'Первичная сумма задолженности',
		'compensated_amount': 'Погашенная сумма задолженности',
		'rfpm_id': 'Код выплаты',
		'last_status': '',
		'iin': 'ИИН',

	}, inplace=True)

	# Возвращаем сам DataFrame и список колонок
	return df, df.columns.tolist()



def get_excel(args: dict):
	stmt=get_stmt(args)

	log.debug(f'GET EXCEL. STMT:\n{stmt}')
	user_rfbn = args.get('user_rfbn', None)
	dep_name = args.get('user_dep_name', None)

	results = []
	mistake = 0
	err_mess = ''
	with get_connection() as connection:
		with connection.cursor() as cursor:
			try:
				cursor.execute(stmt)
				rows = cursor.fetchall()
			except oracledb.DatabaseError as e:
				error, = e.args
				mistake = 1
				err_mess = f"Oracle error: {error.code} : {error.message}"
				log.error(err_mess)
				log.error(f"ERROR with ------select------>\n{stmt}\n")
			
			if mistake>0:
				return  {},[]
			if not rows:
				log.info(f'GET EXCEL. Empty rows in stmt:\n\t{stmt}')
				return  {},[]

			columns = [col[0].lower() for col in cursor.description]
			df = pd.DataFrame(rows, columns=columns)
			log.debug(f"GET_EXCEL. COLUMNS: {columns} : {type(columns)}")
			
			return export_to_excel(df, columns, args, f"REP_{report_code}_{user_rfbn}_{dep_name}.xlsx")
