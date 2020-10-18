/**********************
 서버 => 봇기기 스크립트 파일 다운 및 리로드
 메신저봇 R 기준

 Halfhumun (하프)
 2020.10.01

 원작자 표기 후 복제, 수정, 공유 가능
 **********************/


const scriptName = "SourcePuller";


//적용할 타겟 스크립트 이름
const default_ScriptName = "소스를 적용할 기본 스크립트 이름을 입력하세요.";

//봇 스크립트 파일 경로
path = "애플리케이션 저장소 경로를 입력하세요.";

//서버 url
url = "웹 url을 입력하세요.";

//관리자용 방이름, 프로필 이름, 프로필 해시코드
const admin = {
    "room" : "방이름을 입력하세요 (room)",
    "name" : "이름을 입력하세요 (sender)",
    "hash" : Number //프로필 해시코드를 입력하세요
};


var reload = false;

//하단부 수정 금지
var data = null;
var reqst = false;
var pcs = false;
var target_ScriptName = null;
FS = FileStream;


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
        FS.read(path + '/' + target_ScriptName.replace('.js','') + '/' + target_ScriptName);
        //스크립트 파일 존재 여부
        if(data == undefined) {
            say('파일 접근 불가\n"' + path + '/' + target_ScriptName.replace('.js','') + '/' + target_ScriptName + '" 경로에 해당하는 파일을 찾을 수 없습니다.');
            exit();
            return false;
        }
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
    //target_ScriptName default : specified
    target_ScriptName = targetName === '' ? default_ScriptName : targetName;
    say('서버 상태 & 스크립트 파일 확인중..');
    //오류 확인
    if(Check(target_ScriptName) == true) {
        say("서버 파일을 정상적으로 불러왔습니다.\n'" + target_ScriptName + "' 에 적용할까요? (y/n)");
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

    //response밖 함수용
    say = (str) => {replier.reply(str);};

    var hscd = java.lang.String(imageDB.getProfileImage()).hashCode();

    //방이름, 어드민 프로필 확인
    if(room != admin.room || hscd != admin.hash || sender != admin.name) return;

    //소스적용 함수 호출
    if(msg.startsWith('hpull run')) Pull(msg.substr(9).trim());

    //소스적용 함수 호출시 리로드 자동화
    if(msg == 'hpull -reload') {
        reload = reload? false : true;
        replier.reply('소스 적용시 자동으로 컴파일: ' + reload);
    }

    //Pull 함수 - 소스 적용전 재확인
    if(reqst == true) {
        //진행
        if(msg.toUpperCase() == 'Y') {
            FS.write(path + '/' + target_ScriptName.replace('.js','') + '/' + target_ScriptName, data);
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