
function postUpload (obj) {

    valName = [];
    valId = [];
    for (var i=0; i<obj["data"].length; i++) {
        valName.push(obj["data"][i][obj["return"]]);
        valId.push(obj["data"][i]["id"]);
    }

    valName = valName.join("&nbsp;&nbsp; ");
    valId = valId.join(",");

    $("#pop1 .space .form .formbox .body .row .edit .att-input[data-name='"+obj["target"]+"']")
        .attr("data-value", valId);
    $("#pop1 .space .form .formbox .body .row .edit .att-input[data-name='"+obj["target"]+"'] div span")
        .attr("data-value", valId).html(valName);
}

var postFnc = {

    getUrl: function(url, obj) {

        if ( $(obj).attr("data-mode") == "insert" ) {
            var info = _p["p"]["i"][$(obj).attr("data-i")][$(obj).attr("data-entity")][$(obj).attr("data-mode")]
            if ( info && info["api"] ) return info["api"];

        } else if ( $(obj).attr("data-mode") == "operate" && $(obj).attr("data-type") == "select" ) {

            var info = {} ;
            var target = _p["p"]["i"][$(obj).attr("data-i")][$(obj).attr("data-entity")][$(obj).attr("data-mode")][$(obj).attr("data-target")]["act"];

            if (target && $(obj).attr("data-target-sub")) {
                for (var i=0;i<target.length;i++) {
                    var item = target[i];
                    if ( item["name"] == $(obj).attr("data-target-sub") ) {
                        info = item;
                        break;
                    }
                }
            }
            if ( info && info["api"] ) return info["api"];

        } else if ( $(obj).attr("data-mode") == "flow" ) {
            
            var panelObj = getPanelObj(obj);
            var info = _p["p"]["i"][$(panelObj).attr("data-i")][$(obj).attr("data-entity")]["heads"][$(obj).attr("data-target")][$(obj).attr("data-mode")];
            if ( info && info["api"] ) return info["api"];

        } else {
            var info = _p["p"]["i"][$(obj).attr("data-i")][$(obj).attr("data-entity")][$(obj).attr("data-mode")][$(obj).attr("data-target")]
            if ( info && info["api"] ) return info["api"];
        }

        return url;
    },

    headerTchpwdT: function(obj){

        var postData = getPostData ( null, obj, $("#pop1 .space .formbox"), false );
        if ( postData != null ) {
            var url = _p["const"]["userChpwd"] + "?.g=" + _p["group"];
            callAjax(url, function(obj) {
                modal(_m[_l]["ok"]);
                setTimeout(function(){$("#gh a.att-icon-logout").click();}, 1000);
            }, "POST", JSON.stringify(postData["@data"]["new"][0]));
        }
    },
    
    chartToperateTselect: function(obj){

        var emptyCol = "";
        var inputs = $(obj).parent().find(".att-input[data-target-sub='"+$(obj).attr("data-target-sub")+"']");
        var inputVal = {};
        $(inputs).each (function(i, item){
            inputVal[$(item).attr("data-name")] = $(item).attr("data-value");
            if ( $(item).hasClass("required") && ! inputVal[$(item).attr("data-name")] ) {
                emptyCol = $(item).attr("placeholder");
                return;
            }
        });

        if ( emptyCol != "" ) {
            modal(_m[_l]["required"] + " : " + emptyCol, false );
            return ;
        }

        var panelObj = getPanelObj($(obj));
        var dataArr = [];
        var lists = $(panelObj).find(".chart .chart-table .table tr.row td.fnc-selects-td a.att-selected-item");
        $.each(lists, function(i, list){
            var keys = $(list).parent().parent().find("td.att-key");
            var tmpObj = {};
            $.each(keys, function(j, key){
                tmpObj[$(key).attr("data-name")] = $(key).attr("data-org");
                if ( Object.keys(inputVal).length > 0 ) {
                    Object.assign(tmpObj, inputVal);
                }
            })
            dataArr.push(tmpObj);
        });
        
        if (dataArr.length == 0) {
            modal(_m[_l]["noselect"]);

        } else {

            var postData = {};
            postData["g"] = $(obj).attr("data-g");
            postData["i"] = $(obj).attr("data-i");
            postData["entity"] = $(obj).attr("data-entity");
            postData["mode"] = $(obj).attr("data-mode");
            postData["target"] = $(obj).attr("data-target");
            postData["target-sub"] = $(obj).attr("data-target-sub");
            postData["@data"] = {};
            postData["@data"]["new"] = dataArr;
            
            var url = _p["const"]["execute"];
            url = postFnc["getUrl"](url, obj);

            callAjax(url, function(resObj) {
                modal("ok");
                var panelObj = $("#pan" + resObj["pid"]);
                renderDataUpdate (panelObj, resObj);
                $(panelObj).find(".head .tools a[data-target='" + postData["target"] + "']").click();

            },"POST", JSON.stringify(postData));
        }
    },

    chartToperateTarrange: function(obj){

        var panelObj = getPanelObj($(obj));
        var dataArr = [];
        var lists = $(panelObj).find(".chart .chart-table .table tr.row");

        $.each(lists, function(i, list){
            var keys = $(list).find("td.att-key");
            var tmpObj = {};
            $.each(keys, function(j, key){
                tmpObj[$(key).attr("data-name")] = $(key).attr("data-org");
            })
            dataArr.push(tmpObj);
        });

        var postData = {};
        postData["g"] = $(obj).attr("data-g");
        postData["i"] = $(obj).attr("data-i");
        postData["entity"] = $(obj).attr("data-entity");
        postData["mode"] = $(obj).attr("data-mode");
        postData["target"] = $(obj).attr("data-target");
        postData["@data"] = {};
        postData["@data"]["new"] = dataArr;

        var url = _p["const"]["execute"];
        url = postFnc["getUrl"](url, obj);

        callAjax(url, function(resObj) {
            modal("ok");
            var panelObj = $("#pan" + resObj["pid"]);
            if (_p["p"]["i"][resObj["pid"]]["chart"]["list"] && _p["p"]["i"][postData["i"]]["chart"]["list"]["type"] == "scroll" ) {
                $(panelObj).find(".head .tools a[data-type=reload]").click();
            } else {
                renderDataUpdate (panelObj, resObj);
            }

            $(panelObj).find(".head .tools a[data-target='" + postData["target"] + "']").click();

        },"POST", JSON.stringify(postData));

        

    },

    chartToperateTtable: function(obj){

        var panelObj = getPanelObj($(obj));

        var postData =  getPostData (panelObj, obj, $(panelObj).find(".chart .chart-table .table"), true, "tr.row");
        if (!postData) return;

        var url = _p["const"]["execute"];
        url = postFnc["getUrl"](url, obj);

        callAjax(url, function(resObj) {
            modal("ok");
            var panelObj = $("#pan" + resObj["pid"]);

            if (_p["p"]["i"][resObj["pid"]]["chart"]["list"] && _p["p"]["i"][postData["i"]]["chart"]["list"]["type"] == "scroll" ) {
                $(panelObj).find(".head .tools a[data-type=reload]").click();
            } else {
                renderDataUpdate (panelObj, resObj);
            }
            $(panelObj).find(".head .tools a[data-target='" + postData["target"] + "']").click();
        
        },"POST", JSON.stringify(postData));

        
    },

    chartTexecuteT: function(obj){

        var mainObj = $("#pop1");
        var dataObj = $("#pop1 .space .form .formbox");

        var postData = getPostData (mainObj, obj, dataObj);
        if (postData == null) return;

        var url = _p["const"][postData["mode"]];
        url = postFnc["getUrl"](url, obj);
        
        callAjax(url, function(resObj){
            closePop1(resObj);
            $("#pan" + resObj["pid"]).find(".head .tools a[data-mode=execute]")
                .removeClass("att-selected-item")
                .addClass("att-disable");
        }, 'POST', JSON.stringify(postData));
    },

    chartTinsertT: function(obj){
        
        var mainObj = $("#pop1");
        var dataObj = $("#pop1 .space .form .formbox");

        var postData = getPostData (mainObj, obj, dataObj);
        if (postData == null) return;

        var url = _p["const"]["execute"];
        url = postFnc["getUrl"](url, obj);

        callAjax(url, closePop1, 'POST', JSON.stringify(postData));
    },

    chartTinsertTupload: function(obj){
        if (!$(obj).prev()[0].files[0]) {
            modal( _m[_l]["nofile"], false);
            return;
        }

        var grp = $(obj).attr("data-g");
        var pid = $(obj).attr("data-i");
        var mode = $(obj).attr("data-mode");
        var target = $(obj).attr("data-target");
        var type = $(obj).attr("data-type");

        var formData = new FormData();
        formData.append("g", grp);
        formData.append("i", pid);
        formData.append("entity", "chart");
        formData.append("mode", mode);
        formData.append("run", "real");
        formData.append("target", target);
        formData.append("type", type);

        
        var files = $(obj).prev()[0].files; // 파일 목록 가져오기
        // 모든 파일을 FormData 객체에 추가
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            formData.append("size." + i, file.size);
            formData.append("files[]", file);
        }

        var url = _p["const"]["uploadFile"];
        url += "?.g=" + _p["group"];
        callAjax(url, postUpload, 'POST', formData);

    },

    chartTsearchT : function(obj){
        if (!$(obj).prev().val()) {
            modal( _m[_l]["noquery"], false);
            return;
        }

        var t = $(obj).parent().parent().find(".fnc-selects .att-selected-item").attr("data-value");
        var n = $(obj).parent().parent().find(".fnc-selects .att-selected-item").attr("data-name");

        var queryObj = {}
        queryObj[".i"] = $("#pop1").attr("data-i");
        queryObj["entity"] = $("#pop1").attr("data-entity");
        queryObj["mode"] = "search"
        queryObj["target"] = $(obj).attr("data-target");
        queryObj["q"] = $(obj).prev().val();
        queryObj[n] = t;

        var queryStr = "";
        for ( k in queryObj ) {
            queryStr += "&" + k + "=" + encodeURIComponent(queryObj[k]);
        }

        var url = _p["const"]["search"] + "?" + queryStr;
        callAjax(url, function(resObj){

            var target = $("#pop2 .space .select");
            $(target).html("");

            for ( i in resObj["data"] ) {
                var val = resObj["data"][i]

                var a = $("<a>").addClass("fnc-select-toggle att-div")
                    .attr("href", "#")
                    .attr("data-value", val["v"])
                    .html(val["k"]);

                $(target).append(a);
                
            }

        });
    },

    actionTexecuteT: function(obj) {

        var panelObj = getPanelObj($(obj));
        var postData = getPostData(panelObj, obj);

        postData["@data"]["new"] = [];

        var requiredArr = [];
        if ( $(obj).attr("data-required") ) JSON.parse($(obj).attr("data-required"));
        var cstObj = $(panelObj).find(".search .custom .item .value [data-name]:visible");
        var isValid = true;
        $(cstObj).each(function(i, item) {
            if (!isValid) return;
            var keyName = $(item).attr("data-name");
            var keyAlias = $(item).parent().prev().text();
            if (keyName=="@date") keyName = ".date";

            if ( requiredArr.includes(keyName) && !$(item).attr("data-value") ) {
                modal(_m[_l]["required"] + " conditions : " + keyAlias, false );
                isValid = false;
                return;
            }
            postData["@data"]["new"][0][keyName] = $(item).attr("data-value");
        })

        if (!isValid) return;
        
        $(panelObj).find(".progress").show();
        var url = _p["const"]["execute"];
        callAjax(url, function(resObj) {

            modal(resObj["msg"]);
            _p["actionTask"][resObj["entity"] + "." + resObj["target"]] = new Date();

            if ( "forward" in resObj ) {
                var panelObj = $("#pan" + resObj["forward"]);
                $(panelObj).find(".head .tools .att-tool-reload").click();
            }

            $(panelObj).find(".progress").hide();

        }, 'POST', JSON.stringify(postData));
    },

    chartTflowT: function(obj) {

        if (confirm(_m[_l]["confirm"])) {
            $(obj).attr("data-name", $(obj).attr("data-target"));
            $(obj).addClass("att-input");

            var panelObj = getPanelObj($(obj));
            var postData = getPostData(panelObj, obj, obj.parent().parent().parent());

            var url = _p["const"]["execute"];
            url = postFnc["getUrl"](url, obj);

            callAjax(url, function(resObj) {
                modal("ok");
                var panelObj = $("#pan" + resObj["pid"]);
                
                if (_p["p"]["i"][resObj["pid"]]["chart"]["list"] && _p["p"]["i"]["5"]["chart"]["list"]["type"] == "scroll" ) {
                    $(panelObj).find(".head .tools  a[data-type=reload]").click();

                } else {   
                    renderDataUpdate (panelObj, resObj);
                }
            }, 'POST', JSON.stringify(postData));
        }
    },

    formTexecuteT: function(obj){

        var mainObj = $("#pop1");
        var dataObj = $("#pop1 .space .form .formbox");
        var postData = getPostData (mainObj, obj, dataObj);
        if (postData == null) return;

        var url = _p["const"][postData["mode"]];
        if ($(obj).attr("data-api") && $(obj).attr("data-api") != "") url = $(obj).attr("data-api");

        callAjax(url, closePop1, 'POST', JSON.stringify(postData));
    },

    pop4TtestT: function(obj){

        var mainObj = $("#pop4");
        var dataObj = $(obj).parent().parent().parent();

        var postData = getPostData ( mainObj, obj, dataObj );
        if ( !postData ) return;

        postData["query"] = editorSql.getValue();
        postData["datasource"] = $(obj).prev().find("input").attr("data-value");

        if ( !postData["datasource"] || postData["datasource"] == "" ) {
            modal("DATA_SOURCE is empty!", false);
            return;
        }

        var url = _p["const"]["query"];

        callAjax(url, function(res){

            var context = res["query"] + "<hr>" ;
            var tableHtml = "";

            if ( res["r_code"] == 200 ) {
                if (res["data"] && res["data"].length > 0 ) {
                    tableHtml = getTableFromJson(res["data"])
                }
                else context += res["msg"];
            } else {
                context += res["msg"];
            }

            $("#pop3 .head .console").hide();
            $("#pop3 .head .console pre").html(context);
            $("#pop3 .head .console pre").append(tableHtml);            
            $("#pop3 .head .console").slideDown();

        }, "POST", JSON.stringify(postData));
    },  


    pop5TrunTtool: function(obj){

        datasource = $("#pop5 .head input[data-name=datasource]").val().trim();
        query = $("#pop5 .space .query textarea[data-name=query]").val().trim();

        if ( datasource == "" || query == "" ) {
            modal(_m[_l]["starttoolempty"], false);
            return;
        }
        if ( !isNumeric(datasource) ) {
            modal(_m[_l]["starttoolinvalidnumber"], false);
            return;
        }

        var postData = {};
        postData["datasource"] = datasource;
        postData["query"] = query;
        var url = _p["const"]["tool"] + "?.g=" + _p["group"];
        callAjax(url, function(resObj){

            modal("ok");
            jsonStr = JSON.stringify(JSON.parse(resObj["json"]), null, 4);

            $("#pop5 .space .json .context").html(jsonStr)

        }, 'POST', JSON.stringify(postData));
    },

};

