// XMPP服务器BOSH地址
var BOSH_SERVICE = 'http://172.19.2.197:7070/http-bind/';
var CHAT_HOST = '@apple.local';
 
// XMPP连接
var connection = null;
 
// 当前状态是否连接
var connected = false;
 
// 当前登录的JID
var jid = "";

var messageListAll = [];
// 连接状态改变的事件
function onConnect(status)
{
    if (status == Strophe.Status.CONNECTING) {
	console.log('Strophe is connecting.');
    } else if (status == Strophe.Status.CONNFAIL) {
        console.log('Strophe failed to connect.');
	$('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.DISCONNECTING) {
        console.log('Strophe is disconnecting.');
    } else if (status == Strophe.Status.DISCONNECTED) {
        console.log('Strophe is disconnected.');
	$('#connect').get(0).value = 'connect';
    } else if (status == Strophe.Status.CONNECTED) {
        console.log('Strophe is connected.');
        console.log('ECHOBOT: Send a message to ' + connection.jid + 
        ' to talk to me.');
        if (typeof(Storage) !== "undefined") {//本地存储聊天记录
            messageListAll = eval(JSON.parse(window.localStorage.getItem(jid)));
            if(messageListAll == null || messageListAll == "undefined")
                messageListAll = [];
        }else{
            console.log("抱歉！不支持本地存储");
        }
        connected= true;
        connection.addHandler(onMessage, null, 'message', null, null,  null); 
        connection.send($pres().tree());

    }
}
 
function rawInput(data) 
{
   console.log('RECV: ' + data);
}

function rawOutput(data)
{
    console.log('SENT: ' + data);
}

// 接收到<message>
function onMessage(msg) {
    // 解析出<message>的from、type属性，以及body子元素
    console.log(msg);
    var from = msg.getAttribute('from');
    var type = msg.getAttribute('type');
    var to = msg.getAttribute('to');
    var elems = msg.getElementsByTagName('body');
    if (type == "chat" && elems.length > 0) {
        var body = elems[0];
        var message = {
            'from':from,
            'to':to,
            'body':Strophe.getText(body),
            'time':new Date().format('yyyy-MM-dd hh:ss:mm')
        };
        messageListAll.push(message);
        loadChat();

        var indexAtFrom = from.indexOf("@");
        var fromStr = from.substring(0,indexAtFrom);
        document.getElementById(fromStr).innerHTML = fromStr+"(新消息)";
    }
    return true;
}

function loadChat() {
    $("#msg").empty();
    if (typeof(Storage) !== "undefined") {//本地存储聊天记录
        window.localStorage.setItem(jid,JSON.stringify(messageListAll));
    }else{
        console.log("抱歉！不支持本地存储");
    }
    for(var i=0;i<messageListAll.length;i++){
        var msg = messageListAll[i];
        var indexAtFrom = msg.from.indexOf("@");
        var indexAtTo = msg.to.indexOf("@");
        var from = msg.from.substring(0,indexAtFrom);
        var to = msg.to.substring(0,indexAtTo);
        var recipient = $("#input-contacts").val();
        if(from == recipient|| to == recipient){
            if(from == recipient){
                $("#msg").append("<span style='color:#3c763d'>"+from+ ""+ "("+msg.time+")</span><br>" + msg.body + "<br>")
            }else{
                $("#msg").append("<span style='color:#a94442'>我("+msg.time+")</span><br>" + msg.body + "<br>")
            }
        }
    }
    $("#msg").scrollTop($("#msg")[0].scrollHeight );
}
Date.prototype.format = function(format){
    var o = {
    "M+" : this.getMonth()+1, //month
    "d+" : this.getDate(),    //day
    "h+" : this.getHours(),   //hour
    "m+" : this.getMinutes(), //minute
    "s+" : this.getSeconds(), //second
    "q+" : Math.floor((this.getMonth()+3)/3),  //quarter
    "S" : this.getMilliseconds() //millisecond
    }
    if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
    (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)if(new RegExp("("+ k +")").test(format))
    format = format.replace(RegExp.$1,
    RegExp.$1.length==1 ? o[k] :
    ("00"+ o[k]).substr((""+ o[k]).length));
    return format;
}
$(document).ready(function() {
    
	// 通过BOSH连接XMPP服务器
    $('#btn-login').click(function() {
		if(!connected) {
			connection = new Strophe.Connection(BOSH_SERVICE);
            connection.connect($("#input-jid").val(), $("#input-pwd").val(), onConnect);
            // connection.rawInput = rawInput;
            // connection.rawOutput = rawOutput;
            jid = $("#input-jid").val();       
		}
    });

    // if(!connected) {
    //     connection = new Strophe.Connection(BOSH_SERVICE);
    //     connection.connect($("#input-jid").val(), $("#input-pwd").val(), onConnect);
    //     connection.rawInput = rawInput;
    //     connection.rawOutput = rawOutput;
    //     jid = $("#input-jid").val();
    // }
	
	// 发送消息
	$("#btn-send").click(function() {
		if(connected) {
			if($("#input-contacts").val() == '') {
				alert("请输入联系人！");
				return;
            }
            if($("#input-msg").val() == '') {
				alert("消息不能为空！");
				return;
			}
            // 创建一个<message>元素并发送
            var to = $("#input-contacts").val() + CHAT_HOST;
            var reply = $msg({to: to, from: jid, type: 'chat'})
	        .cnode(Strophe.xmlElement('body',null,$("#input-msg").val()));
            var message = {
                'from':jid,
                'to':to,
                'body':$("#input-msg").val(),
                'time':new Date().format('yyyy-MM-dd hh:ss:mm')
            };
            messageListAll.push(message);
			connection.send(reply.tree());
            loadChat();
			$("#input-msg").val('');
		} else {
			alert("请先登录！");
		}
    });
    $('#exampleModal').on('show.bs.modal', function (event) {
        $("#input-msg").val('');
        var button = $(event.relatedTarget); // Button that triggered the modal
        var recipient = button.data('whatever'); // Extract info from data-* attributes
        document.getElementById(recipient).innerHTML = recipient;

        $("#input-contacts").val(recipient);
        // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
        // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
        var modal = $(this);
        modal.find('.modal-title').text('与' + recipient +'聊天');
        modal.find('.modal-body input').val(recipient);
        loadChat();
        // setTimeout("$('#input-msg')[0].focus();",400)
      });
});

