// variable startDate in queries.js file
let handlers={
	success: function(tx, result){
		document.querySelector('.wrap-logo').style.position = 'static';
		if (result.rows.length === 0){
			return
		}
		let resultRows = result.rows;
		let resultElem = document.querySelector('.result');
		let table = document.createElement('table');
		table.setAttribute('border', '1');
		let thRowElem = document.createElement('tr');
		for (let elem in resultRows[0]){
			let columnElem = document.createElement('th');
			columnElem.innerText = elem;
			thRowElem.appendChild(columnElem);
		}
		table.appendChild(thRowElem);
		for (let i=0; i<resultRows.length; i++){
			let rowElem = document.createElement('tr');
			table.appendChild(rowElem);
			for (let elem in resultRows[i]){
				let columnElem = document.createElement('td');
				columnElem.innerText =  (resultRows[i][elem] === null)? 'NULL' : resultRows[i][elem];
				rowElem.appendChild(columnElem);
			}
		}
		resultElem.appendChild(table);
	},
	error: function(tx, error){
		document.querySelector('.wrap-logo').style.position = 'absolute';
		let resultElem = document.querySelector('.result');
		let errorElem = document.createElement('p');
		errorElem.innerText = error.message;
		errorElem.classList.add('error');
		resultElem.appendChild(errorElem);
	},
	showTables: function(tx, result){
		let rows = [...result.rows];
		let tableListElem = document.querySelector('.tableList');
		tableListElem.innerText = '';
		let ulElem = document.createElement('ul');
		for (let elem in rows){
			let liElem = document.createElement('li');
			ulElem.appendChild(liElem);
			liElem.innerText = rows[elem].name;
		}
		tableListElem.appendChild(ulElem);
	},
	loadTables: function (tx, result){
		let rows = [...result.rows];
		for (let row in rows){
			let table = rows[row].name
			db.transaction(function (tx) { 
			    tx.executeSql(`select * from ${table};`, [], (tx, result)=>handlers.csvParse(tx, result, table+'_table.csv'));
			}); 

		}

	},
	csvParse: function(tx, result, fileName){
		let dataArr = [...result.rows]
		let returnStr = '';
		let firstItter = true;
		for (let row of dataArr){
			if (firstItter){
				for (let elem in row){
					returnStr+=elem+',';
				}
				returnStr=returnStr.slice(0,-1);
				returnStr+='\n';
			}
			for (let elem in row){
				if (String(row[elem]).toLowerCase() !== 'null') {
					returnStr+=row[elem]
				}
				returnStr += ',';
			}
			returnStr=returnStr.slice(0,-1);
			returnStr+='\n';
			firstItter = false;
		}
		loadData(returnStr, fileName)
	}
}

function replaceAll(string, search, substr=' '){
	return string.split(search).join(substr)
}

let db;
try{
	db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024);
	console.log('create db');
}
catch (e){
	alert('Упс... Ваш браузер не поддерживает webSQL. Попробуйте воспользоваться другим \n (Chrome должен помочь)')
}

function getCode(){
	let elem = document.getElementById('code');
	let code = elem.value.split(';')
	let codeArr = code.map(elem=> elem.trim());
	codeArr = codeArr.map(elem=> replaceAll(elem, '\n'));
	codeArr = codeArr.filter(elem=> elem);
	return codeArr
}

function loadStartDate(){
	db.transaction(function (tx) { 
		for (let i=0; i< startDate.length; i++){
	    	tx.executeSql(startDate[i], []);
	    }
	});
	getTablesList();
}


function run(){
	let resultElem = document.querySelector('.result');
	resultElem.innerText = '';
	db.transaction(function (tx) {
		let codeArr = getCode();
	    for (let i=0; i< codeArr.length; i++){
	    	tx.executeSql(codeArr[i], [], handlers.success, handlers.error);
	    }
	}); 
	getTablesList();
}


function loadData(text, fileName){
	let type = 'data:application/csv;charset=utf-8,';
	let hrefStr = type + text;

	let elem = document.createElement('a');
	elem.setAttribute('download', fileName);
	elem.setAttribute('href', hrefStr);
	elem.click();
}

function getTablesList(download = false){

	let code = `SELECT 
    	name
	FROM 
	    sqlite_master 
	WHERE 
	    type ='table' 
	    AND name NOT LIKE 'sqlite_%'
	    and name <> "__WebKitDatabaseInfoTable__"
	`;

	db.transaction(function (tx) { 
		tx.executeSql(code, [], download? handlers.loadTables:handlers.showTables);
	});
}

function saveQuery(){
	localStorage.setItem('query', codeElem.value);
}

function setQuery(){
	codeElem.value = localStorage.getItem('query');
}

let runBtn = document.getElementById('run');
let codeElem = document.getElementById('code');
runBtn.addEventListener('click', ()=>run());
codeElem.addEventListener('input', ()=>saveQuery());

let loadBtn = document.getElementById('load');
loadBtn.addEventListener('click', ()=>getTablesList(true));


let loadStartDataElem = document.getElementById('loadData');
loadStartDataElem.addEventListener('click', ()=>loadStartDate());

getTablesList();
setQuery()

// реализация нажатия TAB
document.getElementById('code').addEventListener('keydown', function(e) {
	if (e.code === 'Tab') {
		e.preventDefault();
		let start = this.selectionStart;
		let end = this.selectionEnd;
		// set textarea value to: text before caret + tab + text after caret
		this.value = this.value.substring(0, start) +
			"   " + this.value.substring(end);
		// put caret at right position again
		this.selectionStart =
			this.selectionEnd = start + 3;
	}
});