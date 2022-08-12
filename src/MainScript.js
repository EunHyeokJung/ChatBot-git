/**********************
 서버 => 봇기기 스크립트 파일 다운 및 리로드
 메신저봇 R 기준

 silverhyeok.dev@gmail.com
 2022.08.13

 원작자 표기 후 복제, 수정, 공유 가능
 **********************/


const scriptName = "SourcePuller.js";


//적용할 타겟 스크립트 이름
let default_ScriptName = "소스를 적용할 기본 스크립트 이름을 입력하세요.";

//봇 스크립트 파일 경로
path = "애플리케이션 저장소 경로를 입력하세요. ex)sdcard/msgbot/Bots";

//서버 url
url = "웹 url을 입력하세요.";

//관리자용 방이름, 프로필 이름, 프로필 해시코드
const admin = {
    "room" : "방이름을 입력하세요 (room)",
    "name" : "이름을 입력하세요 (sender)",
    "hash" : Number //프로필 해시코드를 입력하세요
    //값을 0으로 두면 해시코드 판별은 건너뛸 수 있습니다. (방이름과 이름만 비교)
};


var reload = false;

//하단부 수정 금지
const allsee = "\u200b".repeat(500);
var data = null;
var reqst = false;
var pcs = false;
var target_ScriptName = null;
FS = FileStream;


//파일 존재 여부 확인
function isExist(botName) {
    let list = java.io.File(path).list();
    for(key in list) {
        if(list[key]==botName) {
            return true;
        }
    }
    return false;
}

//default_ScriptName 수정
function setDefaultScript(_scriptName) {

    if(isExist(_scriptName)) {
        default_ScriptName = _scriptName + ".js";
        return true;
    } else {
        return '파일 접근 불가: ' + path + "/" + _scriptName + "/" + _scriptName + ".js 를 찾을 수 없음.";
    }
}

//서버, 스크립트 파일 접근 & 오류 반환 / 데이터 저장
function Check() {
    //이전 작업 상태 확인
    if(pcs == true) {
        say('이미 작업이 진행중인 작업이 있습니다.');
        return;
    }
    try{
        //서버, 스크립트 파일 접근 + 데이터 변환 및 저장
        data = Utils.getWebText(url).replace(/<br>/g,"\n").split("<p>")[1].split("</p>")[0].replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
        let sc = isExist(target_ScriptName);
        if(!sc) {
            say("파일 접근 불가: '" + path + '/' + target_ScriptName + '/' + target_ScriptName + ".js' 경로에 해당하는 파일을 찾을 수 없습니다.");
            exit();
            return false;
        }
        FS.read(path + '/' + target_ScriptName + '/' + target_ScriptName + ".js");
        //오류 반환
    } catch(e) {
        if(e.includes("Malformed URL")) {
            say('서버 접근 불가\n잘못된 URL: "' + URL + '"');
            exit();
            return false;
        }
        else if(e.includes("Unable to resolve host")) {
            say('서버에 접근할 수 없음\n인터넷 연결상태가 좋지 않거나 호스트 이름 "' + e.message.split('"')[1] + '가 올바르지 않습니다.');
            exit();
            return false;
        } else {
            say('알 수 없는 오류\n' + e.message);
            exit();
            return false;
        }
    }
    return true;
}

function Pull(targetName) {
    target_ScriptName = targetName === '' ? default_ScriptName : targetName;
    say('서버 상태 & 스크립트 파일 확인중..');
    //오류 확인
    if(Check(target_ScriptName) == true) {
        say("서버 파일을 정상적으로 불러왔습니다.\n'" + target_ScriptName + ".js' 에 적용할까요? (y/n)");
        reqst = true;
        java.lang.Thread.sleep(30000);
        if (reqst == true) {
            say('30초간 답장을 하지 않아 자동으로 취소되었습니다.');
            exit();
            return;
        }
    }
}

function exit() {
    data = null;
    reqst = false;
    pcs = false;
}


function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {

    if(path.endsWith("/")) path = path.slice(0, path.length-1)

    //response밖 함수용
    say = (str) => {replier.reply(str);};

    var hscd = java.lang.String(imageDB.getProfileImage()).hashCode();

    //방이름, 프로필 확인
    if(room != admin.room || sender != admin.name) return;
    if (admin.hash == 0) {
        if(admin.hash != hscd) return;
    }

    //Default
    if(msg == "hpull -default") {
        replier.reply("Default scriptName: " + default_ScriptName);
        return;
    }
    if(msg.startsWith("hpull default")) {
        let target = msg.substr(13).trim();
        if(target == "") {
            replier.reply("hpull default은 인자로 파일 이름을 붙여야 합니다.\nex) hpull default test.js");
            return;
        }
        if(target.endsWith(".js")) {
            target = target.slice(0, target.length-3);
        }
        let sc = setDefaultScript(target);
        if(sc === true) {
            replier.reply("default script를 " + target + ".js 로 지정했습니다.");
        } else {
            replier.reply(target+"을(를) default script로 지정하지 못했습니다:\n" + sc);
        }
        return;
    }

    //소스적용 함수 호출
    if(msg.startsWith('hpull run')) {
        let sn = msg.substr(9).trim();
        sn = sn.endsWith(".js")?sn.slice(0, sn.length-3):sn;
        Pull(sn);
        return;
    }

    //소스적용 함수 호출시 리로드 자동화
    if(msg == 'hpull -reload') {
        replier.reply('소스 적용시 자동으로 컴파일 여부: ' + reload);
        return;
    }

    if(msg == 'hpull reload') {
        reload = reload? false : true;
        replier.reply('소스 적용시 자동으로 컴파일 여부를 ' + reload + '로 설정했습니다.');
        return;
    }

    //도움말
    if(msg == 'hpull help') {
        replier.reply("KakaoBot-SourcePuller 도움말" + allsee +
            "\n\n이 챗봇은 지정된 서버로부터 업로드된 소스를 받아와 원하는 챗봇에 적용 및 자동 컴파일 하는 기능을 가지고 있습니다." +
            "\n| hpull -default" +
            "\n현재 지정된 default 스크립트 이름을 확인합니다." +
            "\n(default 스크립트: hpull run 실행시 기본으로 지정될 스크립트)\n" +
            "\n| hpull default (name)" +
            "\n디폴트 스크립트를 (name)으로 변경합니다.\n" +
            "\n" +
            "\n| hpull -reload" +
            "\n소스 적용시 자동으로 컴파일 여부를 확인합니다.\n" +
            "\n| hpull reload" +
            "\n소스 적용시 자동으로 컴파일 여부를 변경합니다. (True/False 자동)\n" +
            "\n" +
            "\n| hpull run (name)" +
            "\n서버로부터 소스를 받아와 name 이름의 챗봇 파일에 덮어 씌울지 물어봅니다." +
            "\nY, y, N, n 중 하나로 답하여 소스를 적용할지 말지 결정할 수 있습니다." +
            "\n만약 name 자리에 아무것도 넣지 않으면 default 스크립트에 적용됩니다." +
            "\n\n" +
            "Copyright 2022. EunHyeokJung all rights reserved."
        )
        return;
    }

    //Exception
    if(msg.startsWith('hpull')) {
        replier.reply("[SourcePuller] 명령 '" + msg.substr(5).trim() + "'은(는) 실행가능한 명령이 아닙니다.\n도움말: 'hpull help'");
        return;
    }

    //Pull 함수 - 소스 적용전 재확인
    if(reqst == true) {
        //진행
        if(msg.toUpperCase() == 'Y') {
            FS.write(path + '/' + target_ScriptName + '/' + target_ScriptName + ".js", data);
            replier.reply('적용이 완료되었습니다.');
            //자동 컴파일
            if(reload == true) {
                Api.reload(target_ScriptName);
                replier.reply('자동 컴파일이 완료되었습니다.');
            }
            exit();
        }
        //취소
        if(msg.toUpperCase() == 'N') {
            replier.reply('소스 적용이 취소되었습니다.');
            exit();
        }
    }
}