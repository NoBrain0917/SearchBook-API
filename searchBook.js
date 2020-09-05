/*

  http://localhost:3000/?book=책이름&school=학교이름&local=지역이름

   _____                      __       ____              __  
  / ___/___  ____ ___________/ /_     / __ )____  ____  / /__
  \__ \/ _ \/ __ `/ ___/ ___/ __ \   / __  / __ \/ __ \/ //_/
 ___/ /  __/ /_/ / /  / /__/ / / /  / /_/ / /_/ / /_/ / ,<   
/____/\___/\__,_/_/   \___/_/ /_/  /_____/\____/\____/_/|_|  

Search Boooooooooooooooooooooooooooook
                                                           
*/

const request = require("request");
const express = require("express");
const app = express();
const area = {
    '서울': 'http://reading.ssem.or.kr/',
    '부산': 'http://reading.pen.go.kr/',
    '대구': 'http://reading.edunavi.kr/',
    '인천': 'http://book.ice.go.kr/',
    '광주': 'http://book.gen.go.kr/',
    '대전': 'http://reading.edurang.net/',
    '울산': 'http://reading.ulsanedu.kr/',
    '세종': 'http://reading.sje.go.kr/',
    '경기': 'https://reading.gglec.go.kr/',
    '강원': 'http://reading.gweduone.net/',
    '충북': 'http://reading.cbe.go.kr/',
    '충남': 'http://reading.edus.or.kr/',
    '전북': 'https://reading.jbedu.kr/',
    '전남': 'http://reading.jnei.go.kr/',
    '경북': 'http://reading.gyo6.net/',
    '경남': 'http://reading.gnedu.net/', 
    '제주': 'http://reading.jje.go.kr/' //아직 지원 안함
};

//3000포트로 서버 열기
app.listen(3000, () => {
});

//try로 안잡히는 에러 잡기
process.on('uncaughtException', (err) => {
    console.log(err);
});

//localhost:3000/으로 들어왔을때
app.get("/", (req, res) => {

    try {
    	//필요한 정보들만 냠냠
        let bookName = req.query.book;
        let schoolName = req.query.school;
        let localName = req.query.local;

        if (area[localName] == null) {
            res.json(createError("", "", "알맞지 않은 지역이름 입니다."));
            return;
        } else if(localName == "제주") {
        	    res.json(createError("", "", "아직 제주는 지원하지 않습니다."));
            return;
        }
        
        //학교 코드 불러오기
        request.post({
            url: area[localName] + "r/newReading/search/schoolListData.jsp",
            form: {
                "currentPage": 1,
                "returnUrl": "",
                "selEducation": "all",
                "selSchool": "all",
                "schoolSearch": encodeURI(schoolName)
            },
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36"
            }
        }, (err, response, body) => {
            let schCode;
            let schName;
            let cookie = "";
            try {
                schCode = body.split("개의 학교가 검색되었습니다")[1].split("schoolCodeSetting.jsp?schoolCode=")[1].split("&")[0];
                schName = body.split("개의 학교가 검색되었습니다")[1].split("schoolCodeSetting.jsp?schoolCode=")[1].split(">")[1].split("<")[0];
            } catch (e) {
                res.json(createError("", "", "학교 정보가 없습니다."));
                return;
            }

            //쿠키 가져오기
            let WMONID = 'WMONID=';
            let JSESSIONID = 'JSESSIONID=';
            request.get({
                url: area[localName] + 'r/newReading/search/schoolCodeSetting.jsp?schoolCode=' + schCode + '&returnUrl=',
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36"
                }
            }, (error, response, body) => {
                try {
                    WMONID += response.headers['set-cookie'].join("").split('WMONID=')[1].split(';')[0];
                } catch (e) {
                    WMONID = null;
                }
                
                try {
                    JSESSIONID += response.headers['set-cookie'].join("").split('JSESSIONID=')[1].split(';')[0];
                } catch (e) {
                    JSESSIONID = null;
                }

                if (JSESSIONID == null && WMONID == null) {
                    res.json(createError(schName, schCode, "학교에 대한 쿠키값이 없습니다."));
                    return;
                } else if (WMONID == null && JSESSIONID != null) {
                    cookie = JSESSIONID;
                } else if (WMONID != null && JSESSIONID == null) {
                    cookie = WMONID;
                } else {
                    cookie = JSESSIONID + "; " + WMONID;
                }

                //도서 검색
                request.post({
                    url: area[localName] + "r/newReading/search/schoolSearchResult.jsp",
                    form: {
                        "currentPage": 1,
                        "controlNo": "",
                        "bookInfo": "",
                        "boxCmd": "",
                        "printCmd": "",
                        "pageParamInfo": "",
                        "prevPageInfo": "",
                        "searchPageName": "schoolSearchForm",
                        "schSchoolCode": schCode,
                        "division1": "ALL",
                        "searchCon1": encodeURI(bookName),
                        "connect1": "A",
                        "division2": "TITL",
                        "searchCon2": "",
                        "connect2": "A",
                        "division3": "PUBL",
                        "searchCon3": "",
                        "dataType": "ALL",
                        "lineSize": 10,
                        "division1": "ALL"
                    },
                    headers: {
                        "Cookie": cookie,
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36",
                    }
                }, (err1, response1, body1) => {

                    let schBook = String(body1).replace(/\"/g, "").replace(/\n/g, "").replace(/&nbsp;/g, "").replace(/>/g, "");

                    //보기 좋게 json처리
                    let bookInfo = {};
                    bookInfo.status = "normal";
                    bookInfo.result = [];

                    let bookBase = String(schBook).split("div class=bd_list bd_book_list school_lib")[1];
                    for (let n = 0; n < bookBase.split("bold").length - 1; n++) {
                        bookInfo.result[n] = {};
                        bookInfo.schoolName = schName;
                        bookInfo.schoolCode = schCode;

                        let cls = new classSelector(bookBase);
                        let title = cls.select("span[class=bold]", n + 1);
                        let writer = cls.in("div[class=bd_list_writer]", n + 1).select("span[class=dd]", 1);
                        let company = cls.in("div[class=bd_list_company]", n + 1).select("span[class=dd]", 1);
                        let canRental = cls.select("div[class=rental_box]", n + 1).toString().indexOf("대출가능") != -1;

                        bookInfo.result[n].title = title;
                        bookInfo.result[n].writer = writer;
                        bookInfo.result[n].company = company;
                        bookInfo.result[n].canRental = canRental;

                    }
                    if (bookInfo.result[0] == null) {
                        res.json(createError(schName, schCode, "검색 결과가 없습니다."));
                        return;
                    } else {
                        res.json(bookInfo);
                        return;
                    }
                });
            });
        });
    } catch (e) {
        res.json(createError(schName, schCode, "검색 결과가 없습니다."));
        return;
    }
});

//에러 만들기
createError =  function(sc, c, name) {
    let bookInfo = {};
    bookInfo.schoolName = sc;
    bookInfo.schoolCode = c;
    bookInfo.status = "error";
    bookInfo.result = name;
    return bookInfo;
}

//jsoup selector 짭
classSelector = function(html) {
    this.html = html;
}

classSelector.prototype.select = function(tag, index) {
    let classname = tag.match(/\[(.*)\]/).pop().replace(/class=/g, "");
    return this.html.split(classname)[index].split("</" + tag.split("[")[0])[0].trim();
}

classSelector.prototype.in = function(tag, index) {
    let classname = tag.match(/\[(.*)\]/).pop().replace(/class=/g, "");
    return new classSelector(this.html.split(classname)[index]);
}
