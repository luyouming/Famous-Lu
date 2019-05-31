var anyware = new function() {
    var _config;
    //http://wjdc.zjyc.cn/anyware/CmsPc/mobleLogin
    //var serverIp = "10.44.21.195:8080";
    var serverUrl = window.location.protocol +"//wjdc.zjyc.cn";
    this.ready = function (param, func) {
        //alert(serverUrl + '/anyware/v1/ssotoken/getConfig?rd=' + Date.parse(new Date()));
         if(param.agentId != ""){
            $.ajax({
                type: 'post',
                url: serverUrl + '/anyware/v1/ssotoken/getConfig?rd=' + Date.parse(new Date()),
                data: { agentid: param.agentId },
                cache: false,
                dataType: 'JSON',
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                success: function (data) {
                    //anyware.registerData(param, func, data);
                    _config = data.config;
                    //校验权限的资源id（注册后由平台提供）。不传，返回登录用户信息；传了如果没权限，返回没权限提示，有权限，返回有权限的资源及子集的资源id集合
                    _config.resourcesId = param.resourcesId?param.resourcesId:"";
                    //判断是否执行anyware.writeLog上传日志，如果测试需要记录日志，在param中传入debug:"1", 不传或传其他值，则不执行上传日志。
                    _config.debug = param.debug?param.debug:"0";

                    _config.agentId = param.agentId;

                    //alert(param.agentId+" "+JSON.stringify(_config));
                    anyware.writeLog("getConfig param:" + param.agentId+" "+JSON.stringify(_config));
                    anyware.config({
                        agentId: param.agentId,
                        corpId: _config.corpId,
                        timeStamp: _config.timeStamp,
                        nonceStr: _config.nonceStr,
                        signature: _config.signature,
                        jsApiList: param.jsApiList
                    });
                    dd.error(function (err) {
                        alert('dd error: ' + JSON.stringify(err));
                        anyware.writeLog('dd error: ' + JSON.stringify(err));
                    });
                    anyware.offLineOperation(func);
                },
                error: function (err) {
                    //console.log("ajax:" + JSON.stringify(err));
                    alert("getConfig ready:" + JSON.stringify(err));
                    anyware.writeLog("getConfig ready:" + JSON.stringify(err));
                }
            });
        }else{
            anyware.offLineOperation(func);
        }  
    }
    
    //离线操作（不需要进行dd.config）
    this.offLineOperation = function(func){
        dd.ready(function () {
            func();
        });
    }

    //config
    this.config = function (data) {
        dd.config(data);
    }

    //error
    this.error = function (data) {
        dd.error(data);
    }
    //-----------------------------------------容器-------------------------------
    this.runtime = new runtime();

    function runtime() {

        //获取容器信息
        this.info = function (data) {
            dd.runtime.info(data);
        }

        //获取免登授权码
        this.permission = new permission();

        function permission() {
            this.requestAuthCode = function (func) {
                dd.runtime.permission.requestAuthCode({
                    corpId: _config.corpId,
                    onSuccess: function (info) {
                        //alert("info"+JSON.stringify(info));
                        anyware.writeLog("requestAuthCode:" + JSON.stringify(info));
                        var currentToken="";
                        /*anyware.util.domainStorage.getItem({
                            name: 'anyware-accountinfo',
                            onSuccess: function (acinfo) {*/
                                var acIdx = anyware.util.getQueryString("acIdx");
                                var orIdx = anyware.util.getQueryString("orIdx");
                                
                                //alert('acIdx:' + acIdx + "&orIdx=" + orIdx);

                             

                                if(acIdx == null)
                                {
                                    var acinfo = localStorage.getItem("anyware-accountinfo");                      
                                    
                                    //var acinfo = localStorage.getItem("anyware-accountinfo");
                                    anyware.writeLog("accountinfo:" + JSON.stringify(acinfo));
                                    //alert("anyware-accountinfo:"+acinfo);
                                    if(acinfo && acinfo!=""){
                                        acinfo = JSON.parse(acinfo);
                                        currentToken = acinfo.orgn[0].token;
                                    }
                                }
                                //alert("start getUserInfo...");
                                var resourcesId = _config.resourcesId;
                                if(currentToken == ""){
                                    resourcesId = "";
                                }
                                anyware.writeLog("getUserInfo data:" + JSON.stringify({ code: info.code, token:currentToken, resourcesId: resourcesId}));
                                $.ajax({//获取登录用户信息
                                    type: 'post',
                                    url: serverUrl + '/anyware/v1/ssotoken/getUserInfo',
                                    cache: false,
                                    data: { code: info.code, token:currentToken, resourcesId: resourcesId},
                                    dataType: 'JSON',
                                    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                                    success: function (data) {
                                        anyware.writeLog('getUserInfo: ' + JSON.stringify(data));
                                        var currentAccount;

                                        if(acIdx != null && data.accountinfo.length > 0)
                                        {
                                                // var account = data.accountinfo[acIdx];
                                                var account = data.accountinfo[acIdx];
                                                // var orgn = account.orgn[orIdx];
                                                var orgn = account.orgn[orIdx];
												var resources = null;
												if(account.resources){
													resources = account.resources;
												}
                                                var accJson = {
                                                    acIdx:acIdx,
                                                    mobilephone: account.mobilephone,
                                                    loginname: account.loginname,
                                                    username: account.username,
													resources: resources,
                                                    orgn: [{
                                                        orIdx:orIdx,
                                                        orgncode: orgn.orgncode,
                                                        orgid: orgn.orgid,
                                                        orgnname: orgn.orgnname,
                                                        unitname: orgn.unitname,
                                                        unitid: orgn.unitid,
                                                        token:orgn.token
                                                    }]
                                                };

                                                //alert('获取用户：' + JSON.stringify(accJson));

                                                localStorage.setItem("anyware-accountinfo",JSON.stringify(accJson));
                                                if(func.loginname?true:false)
                                                    func.onSuccess(accJson.orgn[0].token, accJson.loginname);
                                                else
                                                    func.onSuccess(accJson.orgn[0].token);

                                                 //将上个页面日志上传到服务器
                                                anyware.util.saveAccessLog({
                                                    onSuccess: function (message) {
                                                        //记录进入日志
                                                        localStorage.setItem("anyware-saveAccessLogs",JSON.stringify({
                                                            token:accJson.orgn[0].token,
                                                            sysId:_config.agentId,
                                                            sysName:_config.agentId,
                                                            accountOb:window.location.href.split("?")[0],
                                                            name:accJson.username,
                                                            operatingSystem: anyware.util.checkPlatformSystem(),
                                                            accountList:[{account:"进入",type:'1',title:document.title,content:"进入",time:anyware.util.getNowFormatDate("yyyy-MM-dd HH:MM:SS"),length:""}]
                                                        }));
                                                    },
                                                    onFail: function (err) {
                                                    }
                                                });    
                                        }
                                        else
                                        {


                                            if((!currentToken || currentToken=="") ){
                                                if(data.accountinfo.length > 0){
                                                    if(data.accountinfo.length>1 || data.accountinfo[0].orgn.length>1){
                                                        anyware.runtime.permission.selectLoginAccount(data.accountinfo,{
                                                            onSuccess:function(currentAccount){
                                                                //alert("func0:"+func.onSuccess);
                                                                //currentAccount =JSON.parse(sessionStorage.getItem("currentToken")) ;
                                                                //alert("selected Account:"+JSON.stringify(currentAccount));
                                                                //alert(anyware.util.domainStorage.setItem);
                                                                //alert("else0:" + JSON.stringify(currentAccount));
                                                                localStorage.setItem("anyware-accountinfo",JSON.stringify(currentAccount));
                                                                if(func.loginname?true:false)
                                                                    func.onSuccess(currentAccount.orgn[0].token, currentAccount.loginname);
                                                                else
                                                                    func.onSuccess(currentAccount.orgn[0].token);
                                                                /*anyware.util.domainStorage.setItem({
                                                                    name: 'anyware-accountinfo',
                                                                    value: JSON.stringify(currentAccount),
                                                                    onSuccess: function () {
                                                                        //alert("func1:"+func.onSuccess);
                                                                        //alert("token1:"+currentAccount.orgn[0].token);
                                                                        func.onSuccess(currentAccount.orgn[0].token);
                                                                    },
                                                                    onFail: function (err) {
                                                                        func.onFail(err);
                                                                        alert("离线存储accountinfo失败：" + JSON.stringify(err));
                                                                    }
                                                                });*/

                                                                //将上个页面日志上传到服务器
                                                                anyware.util.saveAccessLog({
                                                                    onSuccess: function (message) {
                                                                        //记录进入日志
                                                                        localStorage.setItem("anyware-saveAccessLogs",JSON.stringify({
                                                                            token:currentAccount.orgn[0].token,
                                                                            sysId:_config.agentId,
                                                                            sysName:_config.agentId,
                                                                            accountOb:window.location.href.split("?")[0],
                                                                            name:currentAccount.username,
                                                                            operatingSystem: anyware.util.checkPlatformSystem(),
                                                                            accountList:[{account:"进入",type:'1',title:document.title,content:"进入",time:anyware.util.getNowFormatDate("yyyy-MM-dd HH:MM:SS"),length:""}]
                                                                        }));
                                                                    },
                                                                    onFail: function (err) {
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }else{
                                                        //alert("else1:" + JSON.stringify(currentAccount));
                                                        currentAccount = data.accountinfo[0];
                                                        //currentAccount.orgn[0].token = "C482EBCA93DF3D88A813E37A6E5AC01DB48935CEA6157A18986D1EB3E8A3FB7387713EA89F74DA59CBD4B34957B8FE83BF9B3840FAEAD7A8F09EB37C1F9181A8";
                                                        sessionStorage.setItem("currentToken",currentAccount.orgn[0].token);
                                                        localStorage.setItem("anyware-accountinfo",JSON.stringify(currentAccount));
                                                        if(func.loginname?true:false)
                                                            func.onSuccess(currentAccount.orgn[0].token, currentAccount.loginname);
                                                        else
                                                            func.onSuccess(currentAccount.orgn[0].token);
                                                        /*anyware.util.domainStorage.setItem({
                                                            name: 'anyware-accountinfo',
                                                            value: JSON.stringify(currentAccount),
                                                            onSuccess: function () {
                                                                func.onSuccess(currentAccount.orgn[0].token);
                                                            },
                                                            onFail: function (err) {
                                                                func.onFail(err);
                                                                alert("离线存储accountinfo失败：" + JSON.stringify(err));
                                                            }
                                                        });*/
                                                                
                                                        //将上个页面日志上传到服务器
                                                        anyware.util.saveAccessLog({
                                                            onSuccess: function (message) {
                                                                //记录进入日志
                                                                localStorage.setItem("anyware-saveAccessLogs",JSON.stringify({
                                                                    token:currentAccount.orgn[0].token,
                                                                    sysId:_config.agentId,
                                                                    sysName:_config.agentId,
                                                                    accountOb:window.location.href.split("?")[0],
                                                                    name:currentAccount.username,
                                                                    operatingSystem: anyware.util.checkPlatformSystem(),
                                                                    accountList:[{account:"进入",type:'1',title:document.title,content:"进入",time:anyware.util.getNowFormatDate("yyyy-MM-dd HH:MM:SS"),length:""}]
                                                                }));
                                                            },
                                                            onFail: function (err) {
                                                            }
                                                        });
                                                    }
                                                }else{
                                                    func.onSuccess("");
                                                }
                                            }else{
                                                currentAccount = $.parseJSON(localStorage.getItem("anyware-accountinfo"));
                                                // //currentAccount.orgn[0].token = "C482EBCA93DF3D88A813E37A6E5AC01DB48935CEA6157A18986D1EB3E8A3FB7387713EA89F74DA59CBD4B34957B8FE83BF9B3840FAEAD7A8F09EB37C1F9181A8";
                                                // sessionStorage.setItem("currentToken",currentAccount.orgn[0].token);
                                                // localStorage.setItem("anyware-accountinfo",JSON.stringify(currentAccount));
                                                //alert("else2:" + JSON.stringify(currentAccount));
                                                if(func.loginname?true:false)
                                                    func.onSuccess(currentAccount.orgn[0].token, currentAccount.loginname);
                                                else
                                                    func.onSuccess(currentAccount.orgn[0].token);
                                                
                                                /*anyware.util.domainStorage.setItem({
                                                    name: 'anyware-accountinfo',
                                                    value: JSON.stringify(currentAccount),
                                                    onSuccess: function () {
                                                        func.onSuccess(currentAccount.orgn[0].token);
                                                    },
                                                    onFail: function (err) {
                                                        func.onFail(err);
                                                        alert("离线存储accountinfo失败：" + JSON.stringify(err));
                                                    }
                                                });*/
                                                            
                                                //将上个页面日志上传到服务器
                                                anyware.util.saveAccessLog({
                                                    onSuccess: function (message) {
                                                        //记录进入日志
                                                        localStorage.setItem("anyware-saveAccessLogs",JSON.stringify({
                                                            token:currentAccount.orgn[0].token,
                                                            sysId:_config.agentId,
                                                            sysName:_config.agentId,
                                                            accountOb:window.location.href.split("?")[0],
                                                            name:currentAccount.username,
                                                            operatingSystem: anyware.util.checkPlatformSystem(),
                                                            accountList:[{account:"进入",type:'1',title:document.title,content:"进入",time:anyware.util.getNowFormatDate("yyyy-MM-dd HH:MM:SS"),length:""}]
                                                        }));
                                                    },
                                                    onFail: function (err) {
                                                    }
                                                });
                                            }
                                        }
                                    },
                                    error: function (xhr, errType, err) {
                                        func.onFail(err);
                                        alert("获取免登授权码失败：" + errType + ', ' + err + ',' + JSON.stringify(xhr));
                                    }
                                });
                            /*},
                            onFail: function (err) {
                            }
                        });*/
                        
                    },
                    onFail: function (err) {
                        func.onFail(err);
                    }
                });
            }
            
            //一人多账号一账号多部门时，选择登录用户
            this.selectLoginAccount =  function(accounts,func) {
                var altText = '<ul style="text-align: left;">';
                var acIdx =0;
                
                $.each(accounts, function () {
                    var account = this;
                    var orIdx =0;
                    $.each(this.orgn, function () {
                        var orgn = this;
                        var accJson = {
                            acIdx:acIdx,
                            mobilephone: account.mobilephone,
                            loginname: account.loginname,
                            username: account.username,
                            orgn: [{
                                orIdx:orIdx,
                                orgncode: orgn.orgncode,
                                orgid: orgn.orgid,
                                orgnname: orgn.orgnname,
                                unitname: orgn.unitname,
                                unitid: orgn.unitid,
                                token:orgn.token
                            }]
                        };
                        altText += '<li style="margin-top: 10px;">' +
                                '<label class="label-radio item-content" style="padding-bottom:8px;">' +
                                    '<input type="radio" name="selectAccount" value=\'' + JSON.stringify(accJson) + '\'>' +
                                    '<div class="item-media" style="float: left;width:15%;line-height:1rem">' +
                                        '<i class="icon icon-form-radio"></i>' +
                                    '</div>' +
                                    '<div style="display: inline">' +
                                        '<div class="item-title-row">' +
                                            '<div class="item-after">名称：' + account.username + '</div>' +
                                            '<div class="item-title" style="overflow:hidden;white-space:nowrap;">公司：' + orgn.unitname + '</div>'+
                                            '<div class="item-after">部门：' + orgn.orgnname + '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</label>' +
                            '</li>';
                      orIdx ++;
                    });

                    acIdx ++;
                });
                altText += '</ul>';
                var modal = myApp.modal({
                    title: '选择登录用户',
                    text: '',
                    afterText: altText,
                    buttons: [{
                        text: '确定',
                        bold: true,
                        onClick: function () {
                            var chkAccount = $('input[name="selectAccount"]:checked');
                            if (chkAccount.length > 0) {
                                var accJson = JSON.parse($(chkAccount[0]).val());
                                //accJson.orgn[0].token = "C482EBCA93DF3D88A813E37A6E5AC01DB48935CEA6157A18986D1EB3E8A3FB7387713EA89F74DA59CBD4B34957B8FE83BF9B3840FAEAD7A8F09EB37C1F9181A8";
                                //sessionStorage.setItem("currentToken",accJson.orgn[0].token);
                                sessionStorage.setItem("currentToken",accJson.orgn[0].token);
                                func.onSuccess(accJson);
                            }
                            else{
                                alert("请选择登录用户");
                                return false;
                            }
                        }
                    }]
                });
            }
            this.requestJsToken = function (loginname, orgid, func) {
                $.ajax({//获取用户jstoken
                    type: 'post',
                    url: serverUrl + '/anyware/v1/ssotoken/getToken',
                    cache: false,
                    data: { loginname: loginname, orgid: orgid },
                    dataType: 'JSON',
                    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                    success: function (data) {
                        //alert(JSON.stringify(data));
                        anyware.util.domainStorage.setItem({
                            name: 'token',
                            value: data.token,
                            onSuccess: function () {
                                if (data.errcode == "0") {
                                    //alert(data.token);
                                    func.onSuccess(data.token);
                                }
                                else {
                                    func.onFail("errcode:" + data.errcode + ",errmsg:" + data.errmsg);
                                }
                            },
                            onFail: function (err) {
                                func.onFail(err);
                                alert("离线存储token失败：" + JSON.stringify(err));
                            }
                        });
                    },
                    error: function (xhr, errType, err) {
                        func.onFail(err);
                        alert("获取jstoken失败：" + errType + ', ' + err + ',' + JSON.stringify(xhr));
                    }
                });
            }
        }

        //JSON.stringify(err)
        //获取当前用户信息
        this.getAccountInfo = function (fun) {
            var accInfo = localStorage.getItem('anyware-accountinfo');
            if(accInfo && accInfo!=""){
                fun.onSuccess(JSON.parse(accInfo));
            }
            /*anyware.util.domainStorage.getItem({
                name: 'anyware-accountinfo',
                onSuccess: function (data) {
                    //alert(data.value);
                    fun.onSuccess(JSON.parse(data.value));
                },
                onFail: function (err) {
                    fun.onFail(err);
                    alert("读取离线存储accountinfo失败：" + JSON.stringify(err));
                    anyware.writeLog("读取离线存储accountinfo失败,name:anyware-accountinfo,errmsg:"+ JSON.stringify(err));
                }
            });*/
        }
        
        this.getPasstoken = function(data){
            var data1 = {"appId":data.appId,"appSecret":data.appSecret};
            anyware.writeLog("getPasstoken param:"+JSON.stringify(data1));
            $.ajax({
                type: 'post',
                url: serverUrl+'/anyware/v1/ssotoken/getPassToken',
                cache: false,
                async: false,
                data: JSON.stringify(data1),
                dataType: 'JSON',
                contentType: 'application/json; charset=UTF-8',
                success: function (d2) {
                    //alert("passToken:"+d2.passToken);
                    anyware.writeLog("passToken:"+d2.passToken);
                    data.onSuccess(d2.passToken);
                },
                error: function (xhr, errType, err) {
                    data.onFail("获取passtoken失败：" + errType + ', ' + err + ',' + JSON.stringify(xhr));
                    anyware.writeLog("获取passtoken失败：" + errType + ', ' + err + ',' + JSON.stringify(xhr));
                    //alert("获取passtoken失败：" + errType + ', ' + err + ',' + JSON.stringify(xhr));
                }
            });
        }
        //根据token获取用户是否对resourceId的资源有权访问
        this.getResourceInfo = function(param, func){
             dd.runtime.permission.requestAuthCode({
                    corpId: _config.corpId,
                    onSuccess: function (info) {
                         $.ajax({//获取登录用户信息
                            type: 'post',
                            url: serverUrl + '/anyware/v1/ssotoken/getUserInfo',
                            cache: false,
                            data: { code: info.code, token:param.currentToken, resourcesId: param.resourcesId},
                            dataType: 'JSON',
                            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                            success: function (data) {
                                func.onSuccess(data);
                            },
                            error: function (xhr, errType, err) {
                                //alert("获取免登授权码失败：" + errType + ', ' + err + ',' + JSON.stringify(xhr));
                            }
                        });
                    },
                    onFail: function (err) {
                        //
                    }
             });
        }
    }

    this.device = new device();

    function device() {
        //-----------------------------------------设备-------------------------------
        this.base = new base();
        function base() {
            //获取通用唯一识别码
            this.getUUID = function (data) {
                dd.device.base.getUUID(data);
            }
            //获取热点接入信息
            this.getInterface = function (data) {
                dd.device.base.getInterface(data);
            }
        }

        this.nfc = new nfc();
        function nfc() {
            //读取NFC芯片内容
            this.nfcRead = function (data) {
                dd.device.nfc.nfcRead(data);
            }
            //写NFC芯片
            this.nfcWrite = function (data) {
                dd.device.nfc.nfcWrite(data);
            }
            //停止NFC
            this.nfcStop = function(data){
                dd.device.nfc.nfcStop(data);
            }
        }

        //-----------------------------------------启动器-------------------------------
        this.launcher = new launcher();
        function launcher() {
            //检测应用是否安装
            this.checkInstalledApps = function (data) {
                dd.device.launcher.checkInstalledApps(data);
            }

            //启动第三方应用
            this.launchApp = function (data) {
                dd.device.launcher.launchApp(data);
            }
        }

        this.connection = new connection();
        function connection() {
            //获取当前网络类型
            this.getNetworkType = function (data) {
                dd.device.connection.getNetworkType(data);
            }
        }

        //-----------------------------------------弹窗-------------------------------	
        this.notification = new notification();
        function notification() {
            //alert
            this.alert = function (data) {
                dd.device.notification.alert(data);
            }

            //confirm
            this.confirm = function (data) {
                dd.device.notification.confirm(data);
            }

            //prompt
            this.prompt = function (data) {
                dd.device.notification.prompt(data);
            }

            //vibrate
            this.vibrate = function (data) {
                dd.device.notification.vibrate(data);
            }

            //showPreloader
            this.showPreloader = function (data) {
                dd.device.notification.showPreloader(data);
            }

            //hidePreloader
            this.hidePreloader = function (data) {
                dd.device.notification.hidePreloader(data);
            }

            //toast
            this.toast = function (data) {
                dd.device.notification.toast(data);
            }

            //actionsheet
            this.actionSheet = function (data) {
                dd.device.notification.actionSheet(data);
            }

            //modal
            this.modal = function (data) {
                dd.device.notification.modal(data);
            }
        }

        //-----------------------------------------加速器-------------------------------		
        this.accelerometer = new accelerometer();
        function accelerometer() {
            //摇一摇 开启监听
            this.watchShake = function (data) {
                dd.device.accelerometer.watchShake(data);
            }

            //摇一摇 清除监听
            this.clearShake = function (data) {
                dd.device.accelerometer.clearShake(data);
            }
        }

        //-----------------------------------------地图-------------------------------		
        this.geolocation = new geolocation();
        function geolocation() {
            //获取当前地理位置
            this.get = function (data) {
                dd.device.geolocation.get(data);
            }
        }

        //-----------------------------------------音频-------------------------------		
        this.audio = new audio();
        function audio() {
            //开始录音 启动语音录制，支持最长为60秒（包括）的音频录制。
            this.startRecord = function (data) {
                dd.device.audio.startRecord(data);
            }

            //停止录音 停止语音录制，同时将录制的语音上传到服务端，返回音频资源的MediaID。返回音频的MediaID，可用于本地播放和音频下载
            this.stopRecord = function (data) {
                dd.device.audio.stopRecord(data);
            }

            //监听录音自动停止 当语音录制时间超过60秒时，钉钉会自动停止语音录制，同时将录制的语音上传到服务端，返回音频资源的MediaID。推荐在调用 dd.device.audio.startRecord 前设置监听录音自动停止的回调。
            this.onRecordEnd = function (data) {
                dd.device.audio.onRecordEnd(data);
            }

            //下载音频 使用 dd.device.audio.stopRecord 或者 dd.device.audio.onRecordEnd 获取的MediaId下载音频资源。下载完成后返回音频在本地的MediaId。
            this.download = function (data) {
                dd.device.audio.download(data);
            }

            //播放语音 播放音频，在播放语音前可以使用dd.device.audio.startRecord开启录音，通过dd.device.audio.stopRecord、dd.device.audio.onRecordEnd获取录制的音频的MediaId 或者 通过dd.device.audio.download下载服务端音频资源获取localAudioId。
            this.play = function (data) {
                dd.device.audio.play(data);
            }

            //恢复暂停播放的语音 恢复播放处于暂停状态的语音。
            this.resume = function (data) {
                dd.device.audio.resume(data);
            }

            //停止播放语音 停止播放语音。
            this.stop = function (data) {
                dd.device.audio.stop(data);
            }

            //监听播放自动停止 语音播放完毕时自动调用该方法设置的回调，并返回音频的的本地标识
            this.onPlayEnd = function (data) {
                dd.device.audio.onPlayEnd(data);
            }

            //语音转文字接口
            this.translateVoice = function (data) {
                dd.device.audio.translateVoice(data);
            }
        }

    }

    this.biz = new biz();
    function biz() {
        //-----------------------------------------地图-------------------------------		
        this.map = new map();
        function map() {
            //地图定位
            this.locate = function (data) {
                dd.biz.map.locate(data);
            }

            //POI搜索
            this.search = function (data) {
                dd.biz.map.search(data);
            }

            //展示位置
            this.view = function (data) {
                dd.biz.map.view(data);
            }
        }

        //-----------------------------------------钉盘-------------------------------		
        this.cspace = new cspace();
        function cspace() {
            //转存文件到钉盘
            this.saveFile = function (data) {
                dd.biz.cspace.saveFile(data);
            }

            //转存文件到钉盘
            this.preview = function (data) {
                dd.biz.cspace.preview(data);
            }
        }

        this.util = new util();
        function util() {
            //-----------------------------------------业务-------------------------------					
            //打开应用内页面
            this.open = function (data) {
                dd.biz.util.open(data);
            }
            //在新窗口打开页面
            this.openLink = function (data) {
                dd.biz.util.openLink(data);
            }
            //分享
            this.ddshare = function (data) {
                dd.biz.util.share(data);
            }

            this.sendMessage= function(data){
                var d1 = {
                    "passToken": data.passToken,
                    "json":data.json
                };
                //alert("sendConversation param:"+JSON.stringify(d1));
                anyware.writeLog("share-sendConversation param:"+JSON.stringify(d1));
                $.ajax({
                    type: 'post',
                    url: serverUrl+'/anyware/v1/ddMsg/sendConversation',
                    cache: false,
                    data: JSON.stringify(d1),
                    dataType: 'JSON',
                    contentType: 'application/json; charset=UTF-8',
                    success: function (d) {
                        //alert("sendmsg Result:"+JSON.stringify(d));
                        anyware.writeLog("share-sendmsg Result:"+JSON.stringify(d));
                        if(d.errcode=="0"){
                            data.onSuccess(JSON.stringify(d));
                        }
                        else{
                             data.onFail("errcode:"+d.errcode+",errmsg:"+d.errmsg);
                        }
                    },
                    error: function (xhr, errType, err) {
                        data.onFail("sendMessage失败:" + errType + ', ' + err + ',' + JSON.stringify(xhr));
                        //alert("sendMessage失败" + errType + ', ' + err + ',' + JSON.stringify(xhr));
                    }
                });
            }
            //直接选择联系人进行分享的接口
            this.share = function (data) {
                anyware.writeLog("share param:"+JSON.stringify(data));
                //anyware.biz.chat.chooseConversation({
                anyware.biz.chat.pickConversation({
		            //corpId: 'ding08a612d56238703335c2f4657eb6378f',
                    isConfirm: true,
                    onSuccess: function (d) {
                        //alert(JSON.stringify(d))
                        var cid = d.cid;
                        var json = {
                            "sender": "",
                            "token": data.token,
                            "channeltype":"2",
                            "cid": cid,
                            "msgtype": "link",
                            "message": {
                                "messageUrl": data.url,
                                "picUrl":data.picUrl,
                                "title": data.title,
                                "text": data.text
                            }
                        }
                        //alert(anyware.biz.util.sendMessage);
                        anyware.biz.util.sendMessage({
                            passToken:data.passToken,
                            json:json,
                            onSuccess:data.onSuccess,
                            onFail:data.onFail
                        });
                        /*{
                            id:cid,//会话ID
                            title:"标题"，//标题
                            isEnterpriseGroup:false, // 是否企业群组
                        }*/
                    },
                    onFail:function(data){
                    }
                });
            
                //dd.biz.util.share(fun);
                /*
                fun demo:
                {
                    isConfirm:bool,
                    url: String,
                    title: String,
                    content: String,
                    image: String,
                    onSuccess:function(data){},
                    onFail:function(err){}
                }                
                */
                //if (!fun.url || fun.url == '') {
                //    fun.onFail("分享的URL 不能为空");
                //}
                //if (!fun.isConfirm) fun.isConfirm = true;
                //if (!fun.title) fun.tit = fun.url;
                //if (!fun.content) fun.conten = '';
                //if (!fun.image) fun.image = ''; // 默认图片



                //dd.chat.choseConvetsation({
                //    isConfirm: fun.isConfirm,
                //    onSuccess: function (data) {
                //        /*
                //        {
                //            id:cid,//会话ID
                //            title:"标题"，//标题
                //            isEnterpriseGroup:false, // 是否企业群组
                //        }
                //        */


                //    },
                //    onFail: function (err) {
                //        fun.onFail(err);
                //        alert("chat.choseConvetsation失败：" + JSON.stringify(err));
                //    }
                //});
            }
            //ut数据埋点
            //ISV与钉钉进行数据对接的数据埋点接口，用于采集用户数据，ISV可根据微应用中关键操作进行埋点
            this.ut = function (data) {
                dd.biz.util.ut(data);
            }

            //上传图片
            this.uploadImage = function (data) {
                dd.biz.util.uploadImage(data);
            }

            //上传图片（仅支持拍照上传）
            this.uploadImageFromCamera = function (data) {
                dd.biz.util.uploadImageFromCamera(data);
            }

            //图片浏览器
            this.previewImage = function (data) {
                dd.biz.util.previewImage(data);
            }

            //日期选择器 日期
            this.datepicker = function (data) {
                dd.biz.util.datepicker(data);
            }

            //日期选择器 时间
            this.timepicker = function (data) {
                dd.biz.util.timepicker(data);
            }

            //日期选择器 日期+时间
            this.datetimepicker = function (data) {
                dd.biz.util.datetimepicker(data);
            }

            //下拉控件
            this.chosen = function (data) {
                dd.biz.util.chosen(data);
            }

            //-----------------------------------------扫码-------------------------------
            this.scan = function (data) {
                dd.biz.util.scan(data);
            }

            //-----------------------------------------客户端加密、解密-------------------------------
            //加密 开发者在使用我们的jsapi进行数据传输的过程中，如果需要对数据进行加密处理，可以使用我们提供的加密api
            this.encrypt = function (data) {
                dd.biz.util.encrypt(data);
            }

            //解密 开发者在使用我们的jsapi进行数据传输的过程中，如果需要对数据进行解密处理，可以使用我们提供的解密api
            this.decrypt = function (data) {
                dd.biz.util.decrypt(data);
            }
        }

        this.chat = new chat();
        function chat() {
            //-----------------------------------------会话-------------------------------		
            //获取会话信息
            this.pickConversation = function (data) {
                dd.biz.chat.pickConversation(data);
            }

            //根据corpid选择会话
            this.chooseConversationByCorpId = function (data) {
                dd.biz.chat.chooseConversationByCorpId(data);
            }

            //打开与某个用户的聊天页面（单聊会话）
            this.openSingleChat = function(data){
                dd.biz.chat.openSingleChat(data);
            }

            //通过通讯录选人或部门
            this.chooseConversation = function (data) {
                dd.biz.chat.chooseConversation(data);
            }
            //通过通讯录选人或部门
            this.choseConvetsation = function (data) {
                dd.biz.chat.choseConvetsation(data);
            }

            //根据chatid跳转到对应会话
            this.toConversation = function (data) {
                dd.biz.chat.toConversation(data);
            }

            //-----------------------------------------聊天页面活动视图入口-------------------------------
            // 接口说明
            this.locationChatMessage = function (data) {
                dd.biz.chat.locationChatMessage(data);
            }
        }

        //-----------------------------------------聊天页面活动视图入口-------------------------------		
        this.intent = new intent();
        function intent() {
            //获取IM消息
            this.fetchData = function (data) {
                dd.biz.intent.fetchData(data);
            }
        }

        //-----------------------------------------Ding-------------------------------		
        this.ding = new ding();
        function ding() {
            //发钉 钉类型 1：image  2：link
            this.post = function (data) {
                dd.biz.ding.post(data);
            }
        }

        //-----------------------------------------电话-------------------------------		
        this.telephone = new telephone();
        function telephone() {
            //打电话
            this.call = function (data) {
                dd.biz.telephone.call(data);
            }
            //通用电话拨打
            this.showCallMenu = function (data) {
                dd.biz.telephone.showCallMenu(data);
            }
        }

        //-----------------------------------------企业通讯录-------------------------------		
        this.contact = new contact();
        function contact() {
            //选人 corpid必须是用户所属的企业的corpid  此接口只能对用户进行选择，若要同时选择部门，请使用“选人，选部门”接口。
            this.choose = function (data) {
                dd.biz.contact.choose(data);
            }

            //选人，选部门 corpid必须是用户所属的企业的corpid
            this.complexChoose = function (data) {
                dd.biz.contact.complexChoose(data);
            }

            //选部门 支持选择部门后，把所选部门转换成对应部门下的人，permissionType可以添加权限校验
            this.complexPicker = function (data) {
                dd.biz.contact.complexPicker(data);
            }

            //创建企业群聊天 corpid必须是用户所属的企业的corpid
            this.createGroup = function (data) {
                dd.biz.contact.createGroup(data);
            }

            //设定规则选人 对选中人员设置规则接口。此接口会把选中的联系人和调用方传入的规则id 和 规则名称进行绑定。
            this.setRule = function (data) {
                dd.biz.contact.setRule(data);
            }
        }

        //-----------------------------------------自定义联系人-------------------------------		
        this.customContact = new customContact();
        function customContact() {
            //单选自定义联系人 选取单个自定义联系人
            this.choose = function (data) {
                dd.biz.customContact.choose(data);
            }

            //多选自定义联系人 选取多个自定义联系人
            this.multipleChoose = function (data) {
                dd.biz.customContact.multipleChoose(data);
            }
        }

        //-----------------------------------------导航栏-------------------------------		
        this.navigation = new navigation();
        function navigation() {
            //设置导航栏颜色 在url后面拼接dd_nav_bgcolor参数即可，如下： 支持的格式:“AARRGGBB”
            this.setTitle = function (data) {
                dd.biz.navigation.setTitle(data);
            }

            //标题栏添加问号Icon 调用此jsapi之后，icon的显示位置在Android和iOS上有所区别
            this.setIcon = function (data) {
                dd.biz.navigation.setIcon(data);
            }

            //设置左侧导航按钮 因为Android导航栏左侧显示的是标题（设置导航栏标题），所以此jsapi只支持iOS。
            this.setLeft = function (data) {
                dd.biz.navigation.setLeft(data);
            }

            //触发关闭 调用此jsapi可以关闭当前浏览器窗口
            this.close = function (data) {
                dd.biz.navigation.close(data);
            }

            //设置导航栏右侧 调用jsapi-setRight可以设置导航栏最右侧按钮的文字，并且接收点击事件，只能设置文本按钮，需要设置按钮的icon请查看设置下面的导航栏右侧多个按钮
            this.setRight = function (data) {
                dd.biz.navigation.setRight(data);
            }

            //设置导航栏右侧多个按钮 每一个item对应右上角的一个按钮 点击任一一个按钮将会回调onSuccess，并返回被点击item的id
            this.setMenu = function (data) {
                dd.biz.navigation.setMenu(data);
            }
        }

        //-----------------------------------------通用JSAPI接口获取用户信息-------------------------------		
        this.user = new user();
        function user() {
            //通用JSAPI接口获取用户信息 开发者在某些场合需要获取用户的基本信息，而这些用户都不在一个企业组织下面，可以使用这个接口。
            this.get = function (data) {
                dd.biz.user.get(data);
            }
        }

        //-----------------------------------------支付-------------------------------		
        this.alipay = new alipay();
        function alipay() {
            //支付接口 集成了支付宝移动支付SDK并对支付SDK的接口做了JS形式的包装，开发者可以使用该接口可以唤起支付宝或者支付宝SDK内置的支付页面完成支付功能。
            //该接口只是对支付宝移动支付SDK的支付接口做了JS形式封装，支付流程的打通还需要开发者根据支付宝相关文档完成。
            this.pay = function (data) {
                dd.biz.alipay.pay(data);
            }
        }
    }

    this.ui = new ui();
    function ui() {
        //-----------------------------------------UI控件-------------------------------		
        this.input = new input();
        function input() {
            //输入框
            this.plain = function (data) {
                dd.ui.input.plain(data);
            }
        }
        this.progressBar = new progressBar();
        function progressBar() {
            //设置顶部进度条颜色
            this.setColors = function (data) {
                dd.ui.progressBar.setColors(data);
            }
        }
        this.pullToRefresh = new pullToRefresh();
        function pullToRefresh() {
            //启用下拉刷新
            this.enable = function (data) {
                dd.ui.pullToRefresh.enable(data);
            }

            //收起下拉loading
            this.stop = function () {
                dd.ui.pullToRefresh.stop();
            }

            //禁用下拉刷新
            this.disable = function () {
                dd.ui.pullToRefresh.disable();
            }
        }
        this.webViewBounce = new webViewBounce();
        function webViewBounce() {
            //启用bounce
            this.disable = function () {
                dd.ui.webViewBounce.disable();
            }
        }

    }

    //-----------------------------------------数据埋点-------------------------------
    this.writeLog = function (data) {
        if(_config.debug == "1"){
            $.ajax({
                type: 'post',
                url: serverUrl+'/anyware/v1/log/writeLog',
                cache: false,
                data: {"log":data},
                dataType: 'json',
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                success: function (req) {
                    //alert("日志返回："+JSON.stringify(req));
                },
                error: function (xhr, type, exception) {
                    //alert("回写日志出错："+JSON.stringify("xhr:"+xhr+",type:"+type+",exception:"+exception));
                }
            });
        }
    }

    //-----------------------------------------离线存取-------------------------------		
    this.util = new util();
    function util() {
        this.domainStorage = new domainStorage();
        function domainStorage() {
            //离线存数据
            this.setItem = function (data) {
                dd.util.domainStorage.setItem(data);
            }

            //离线取数据
            this.getItem = function (data) {
                dd.util.domainStorage.getItem(data);
            }
        }

        this.getQueryString = function(name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
            var para = decodeURIComponent(window.location.search);
            var r = para.substr(1).match(reg);
            if (r != null) return unescape(r[2]); return null;
        }

        this.waterMark = function(waterText) {
            //默认设置
            var defaultSettings={
                watermark_txt:waterText,
                watermark_x:20,//水印起始位置x轴坐标
                watermark_y:60,//水印起始位置Y轴坐标
                watermark_rows:20,//水印行数
                watermark_cols:20,//水印列数
                watermark_x_space:40,//水印x轴间隔
                watermark_y_space:50,//水印y轴间隔
                watermark_color:'#A2A2A2',//水印字体颜色
                watermark_alpha:0.3,//水印透明度
                watermark_fontsize:'18px',//水印字体大小
                watermark_font:'微软雅黑',//水印字体
                watermark_width:120,//水印宽度
                watermark_height:80,//水印长度
                watermark_angle:45//水印倾斜度数
            };
            //采用配置项替换默认值，作用类似jquery.extend
            /*if(arguments.length===1&&typeof arguments[0] ==="object" ){
                var src=arguments[0]||{};
                for(key in src)
                {
                    if(src[key]&&defaultSettings[key]&&src[key]===defaultSettings[key])
                        continue;
                    else if(src[key])
                        defaultSettings[key]=src[key];
                }
            }*/

            var oTemp = document.createDocumentFragment();

            //获取页面最大宽度
            var page_width = Math.max(document.body.scrollWidth,document.body.clientWidth);
            //获取页面最大长度
            var page_height = Math.max(document.body.scrollHeight,document.body.clientHeight)-50;

            //如果将水印列数设置为0，或水印列数设置过大，超过页面最大宽度，则重新计算水印列数和水印x轴间隔
            if (defaultSettings.watermark_cols == 0 ||
        　　　　(parseInt(defaultSettings.watermark_x 
        　　　　+ defaultSettings.watermark_width *defaultSettings.watermark_cols 
        　　　　+ defaultSettings.watermark_x_space * (defaultSettings.watermark_cols - 1)) 
        　　　　> page_width)) {
                defaultSettings.watermark_cols = 
        　　　　　　parseInt((page_width
        　　　　　　　　　　-defaultSettings.watermark_x
        　　　　　　　　　　+defaultSettings.watermark_x_space) 
        　　　　　　　　　　/ (defaultSettings.watermark_width 
        　　　　　　　　　　+ defaultSettings.watermark_x_space));
                defaultSettings.watermark_x_space = 
        　　　　　　parseInt((page_width 
        　　　　　　　　　　- defaultSettings.watermark_x 
        　　　　　　　　　　- defaultSettings.watermark_width 
        　　　　　　　　　　* defaultSettings.watermark_cols) 
        　　　　　　　　　　/ (defaultSettings.watermark_cols - 1));
            }
            //如果将水印行数设置为0，或水印行数设置过大，超过页面最大长度，则重新计算水印行数和水印y轴间隔
            if (defaultSettings.watermark_rows == 0 ||
        　　　　(parseInt(defaultSettings.watermark_y 
        　　　　+ defaultSettings.watermark_height * defaultSettings.watermark_rows 
        　　　　+ defaultSettings.watermark_y_space * (defaultSettings.watermark_rows - 1)) 
        　　　　> page_height)) {
                defaultSettings.watermark_rows = 
        　　　　　　parseInt((defaultSettings.watermark_y_space 
        　　　　　　　　　　　+ page_height - defaultSettings.watermark_y) 
        　　　　　　　　　　　/ (defaultSettings.watermark_height + defaultSettings.watermark_y_space));
                defaultSettings.watermark_y_space = 
        　　　　　　parseInt((page_height 
        　　　　　　　　　　- defaultSettings.watermark_y 
        　　　　　　　　　　- defaultSettings.watermark_height 
        　　　　　　　　　　* defaultSettings.watermark_rows) 
        　　　　　　　　　/ (defaultSettings.watermark_rows - 1));
            }
            var x;
            var y;
            for (var i = 0; i < defaultSettings.watermark_rows; i++) {
                y = defaultSettings.watermark_y + (defaultSettings.watermark_y_space + defaultSettings.watermark_height) * i;
                for (var j = 0; j < defaultSettings.watermark_cols; j++) {
                    x = defaultSettings.watermark_x + (defaultSettings.watermark_width + defaultSettings.watermark_x_space) * j;

                    var mask_div = document.createElement('div');
                    mask_div.id = 'mask_div' + i + j;
                    mask_div.appendChild(document.createTextNode(defaultSettings.watermark_txt));
                    //设置水印div倾斜显示
                    mask_div.style.webkitTransform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
                    mask_div.style.MozTransform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
                    mask_div.style.msTransform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
                    mask_div.style.OTransform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
                    mask_div.style.transform = "rotate(-" + defaultSettings.watermark_angle + "deg)";
                    mask_div.style.visibility = "";
                    mask_div.style.position = "absolute";
                    mask_div.style.left = x + 'px';
                    mask_div.style.top = y + 'px';
                    mask_div.style.overflow = "hidden";
                mask_div.style.pointerEvents = "none";
                    mask_div.style.zIndex = "5000";//水印所在图层
                    //mask_div.style.border="solid #eee 1px";
                    mask_div.style.opacity = defaultSettings.watermark_alpha;
                    mask_div.style.fontSize = defaultSettings.watermark_fontsize;
                    mask_div.style.fontFamily = defaultSettings.watermark_font;
                    mask_div.style.color = defaultSettings.watermark_color;
                    mask_div.style.textAlign = "center";
                    mask_div.style.width = defaultSettings.watermark_width + 'px';
                    mask_div.style.height = defaultSettings.watermark_height + 'px';
                    mask_div.style.display = "block";
                    oTemp.appendChild(mask_div);
                };
            };
            document.body.appendChild(oTemp);
        }

        /**
         * 获取设备操作系统
         */
        this.checkPlatformSystem = function () {
            var result = "其他";
            var u = navigator.userAgent;
            if (u.indexOf('Android') > -1 || u.indexOf('Linux') > -1) {//安卓手机
                result = "android";
            } else if (u.indexOf('iPhone') > -1) {//苹果手机
                result = "ios";
            } else if (u.indexOf('Windows Phone') > -1) { //winphone手机

            }
            return result;
        }

        /**
         * 访问日志记录 业务埋点
         * account（操作描述）
         * content（零售户许可证编号）
         * begTime （操作开始时间 new Date();）
         * aalX（坐标x）
         * aalY(坐标y)）
         */
        this.addBizAccessLog = function(data){
            try{
                var accJsonLog = $.parseJSON(localStorage.getItem("anyware-saveAccessLogs")); 
                //alert('accJsonLog: '+JSON.stringify(accJsonLog));
                accJsonLog.accountList.push({
                    account: data.account,
                    type:'2',
                    time: anyware.util.getNumSeconds(data.begTime),
                    content: data.content, 
                    title: document.title,
                    length: "",
                    aalX: data.aalX, 
                    aalY: data.aalY,
                    operatingSystem: anyware.util.checkPlatformSystem()
                });
                localStorage.setItem("anyware-saveAccessLogs",JSON.stringify(accJsonLog)); 
            }catch(err){
                this.writeLog("addBizAccessLog：访问日志记录出错："+err + "#data：" + JSON.stringify(data))
            } 
        }

        /**
         * 访问日志记录 界面埋点
         * account（操作描述））
         */
        this.addFunAccessLog = function(data){
            try{
                var accJsonLog = $.parseJSON(localStorage.getItem("anyware-saveAccessLogs")); 
                //alert('accJsonLog: '+JSON.stringify(accJsonLog));
                accJsonLog.accountList.push({
                    account: data.account,
                    type:'1',
                    time: anyware.util.getNowFormatDate("yyyy-MM-dd HH:MM:SS"), 
                    content: "", 
                    title: document.title,
                    length: "",
                    aalX: "", 
                    aalY: "",
                    operatingSystem: anyware.util.checkPlatformSystem()
                });
                localStorage.setItem("anyware-saveAccessLogs",JSON.stringify(accJsonLog)); 
            }catch(err){
                this.writeLog("addFunAccessLog：访问日志记录出错："+err + "#data：" + JSON.stringify(data))
            }  
        }
        
        
        //访问日志记录保存到服务器
        this.saveAccessLog = function(func) {
            //获取上个页面日志
            try
            {
                var accessLog = localStorage.getItem("anyware-saveAccessLogs");
                if(accessLog && accessLog !=""){
                    var logs = $.parseJSON(accessLog);
                    var nowDate =  anyware.util.getNowFormatDate("yyyy-MM-dd HH:MM:SS");
                    var outNum = anyware.util.getNumSeconds(logs.accountList[0].time);
                    var content = logs.accountList[0].content;
                    logs.accountList[0].length = outNum;
                    // logs.accountList.push({account:"离开",content:"离开" + logs.accountList[0].content.substr(2),time:nowDate});
                    // logs.accountList.push({account:"停留",content:outNum,time:nowDate});
                    $.ajax({
                        type: 'post',
                        url: serverUrl+'/anyware/v1/awAccessLog/addAccessLog',
                        cache: false,
                        data: JSON.stringify(logs),
                        dataType: 'json',
                        contentType: 'application/json',
                        success: function (req) {
                            func.onSuccess("访问日志记录返回："+JSON.stringify(req));
                        },
                        error: function (xhr, type, exception) {
                            func.onFail("访问日志记录出错："+JSON.stringify("xhr:"+xhr+",type:"+type+",exception:"+exception));
                            logs.accountList.push({account:"断网",content:"记录日志失败：" + exception,time:nowDate});
                            // alert("访问日志记录出错："+JSON.stringify("xhr:"+xhr+",type:"+type+",exception:"+exception));
                        }
                    });

                    //频繁访问同一个页面，将被视为违规操作，目前定义为：5秒内超过3次访问同一个URL
                    var repeatLog = localStorage.getItem(logs.accountOb);
                    if(!repeatLog || repeatLog==""){
                        localStorage.setItem(logs.accountOb,JSON.stringify({inHtml:logs.accountOb,num:"1",time:logs.accountList[0].time}));
                    }else{
                        var repeat = $.parseJSON(repeatLog);
                        repeat.num = Number(repeat.num)+1;
                        localStorage.setItem(logs.accountOb,JSON.stringify(repeat));
                        //alert(anyware.util.getNumSeconds(repeat.time));
                        //如果超过5s则从新记录时间
                        if(anyware.util.getNumSeconds(repeat.time) > 5){
                            localStorage.setItem(logs.accountOb,JSON.stringify({inHtml:logs.accountOb,num:"1",time:logs.accountList[0].time}));
                        }else{
                            if(Number(repeat.num) > 2){
                                alert("违规操作!");
                            }
                        }
                    }
                }else{
                    func.onSuccess("第一次登录没有上次日志");
                }
            }catch(err)
            {
                _config.debug = "1";
                this.writeLog("saveAccessLog：访问日志记录出错："+err)
                func.onFail("访问日志记录出错："+err);
                _config.debug = "0";
            }
            
        }

        
        //获取日期之间的时差  单位秒
        this.getNumSeconds = function(startDate){
            var end_str = (anyware.util.getNowFormatDate("yyyy-MM-dd HH:MM:SS")).replace(/-/g, "/");

            var end_date = new Date(end_str);

            var sta_str = (startDate).replace(/-/g, "/");

            var sta_date = new Date(sta_str);

            var secondsNum = (end_date - sta_date) / 1000;

            return secondsNum;
        }

        //获取当前的日期时间
        this.getNowFormatDate = function(format) {
            var date = new Date();
            var seperator1 = "-";
            var seperator2 = ":";
            var month = date.getMonth() + 1;
            var strDate = date.getDate();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();

            if (month >= 1 && month <= 9) {
                month = "0" + month;
            }

            if (strDate >= 0 && strDate <= 9) {
                strDate = "0" + strDate;
            }

            if (hours >= 0 && hours <= 9) {
                hours = "0" + hours;
            }

            if (minutes >= 0 && minutes <= 9) {
                minutes = "0" + minutes;
            }

            if (seconds >= 0 && seconds <= 9) {
                seconds = "0" + seconds;
            }
            var currentdate;

            if (format == "yyyy-MM-dd HH:MM")
                currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate + " " + hours + seperator2 + minutes;
            if (format == "yyyy-MM-dd HH:MM:SS")
                currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate + " " + hours + seperator2 + minutes + seperator2 + seconds;
            if (format == "yyyy-MM-dd")
                currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate;

            return currentdate;

        }

        //打开概况功能页面
        this.openSurveyUrl = function(lcnsNo){
           var data = {
                LcnsNo : lcnsNo
            }

            $.when(GetServerData.prototype.GetDataToServer(window.location.protocol +"//" + appConfig.UrlIpPort + "/yddc/app/platform/nairemanage/getRetailUserInfo", data, "json"))
            .then(function (req) {
                if (req.length > 0) {
                        var Urlparams = "http://wjdc.zjyc.cn/zhcx/khxx_xx.html?dd_nav_bgcolor=FF1fa3ff&origin_link=homepage&" + 
                        "mblePhneNmbr="+ (req[0].mblePhneNmbr != undefined ? req[0].mblePhneNmbr : "")  +"&"+    // 电话
                        "mstrTelNo="+ (req[0].mstrTelNo != undefined ? req[0].mstrTelNo : "") +"&"+          //主呼电话
                        "prnlMblPhnNo="+ (req[0].prnlMblPhnNo != undefined ? req[0].prnlMblPhnNo : "")          +"&"+    // 家家E电话
                        "bkupTelNo="+ (req[0].bkupTelNo != undefined ? $.trim(req[0].bkupTelNo) : "") +"&"+          // 备用电话
                        "lcnsNo="+ (req[0].lcnsNo != undefined ? req[0].lcnsNo : "") +"&"+                //  许可证号
                        "gisLngd="+ (req[0].gisLngd != undefined ? req[0].gisLngd : "") +"&"+              // 零售户Gis坐标   
                        "gisLttd="+ (req[0].gisLttd != undefined ? req[0].gisLttd : "") +"&"+              // 零售户Gis坐标
                        "DSSX="+ (req[0].dssx != undefined ? req[0].dssx : "") +"&"+                      // 地市信息（当前客户是杭州就是 HZ，宁波就是 NB）
                        "CSTR_ID="+ (req[0].cstrId != undefined ? req[0].cstrId : "") +"&"+             // 零售户编号
                        "YBKH="+ (req[0].ybkh != undefined ? req[0].ybkh : "") +"&"+                        //是否样本客户
                        "BLNG_SELL_LINE="+ (req[0].blngSellLine != undefined ? req[0].blngSellLine : "") +"&"+       // 线路编码
                        "BLNG_MKT="+ (req[0].blngMkt != undefined ? req[0].blngMkt : "") +"&"+             // 市场部编码
                        "LMT_TYPE="+ (req[0].lmtType != undefined ? req[0].lmtType : "") +"&"+                   // 限量类别
                        "BLNG_CNTY_ID="+ (req[0].blngCntyId != undefined ? req[0].blngCntyId : "") +"&"+           // 区县编码
                        "BLNG_CITY_ID="+ (req[0].blngCityId != undefined ? req[0].blngCityId : "");            // 地市编码  
                        //alert('url: '+Urlparams);
                        window.location.href = Urlparams; 
                }
            });	
        }
        




    }
}


