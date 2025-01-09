
// render function
////////////////////////////////////////////////////////////////////

function renderLogo(obj) {

    var logoObj = $("#gl");
    var group = $("#gm .group");
    var title = "";
    var start = null;

    $.each(obj["data"], function(i, item) {

        var name = item["name"];
        if (name == _p["title"]) name += "<span class='ver'>" + _p["version"] + "</span>";
        var tmpObj = $("<a>").addClass("fnc-logo-group")
                             .attr("href", "?.g=" + item["idx"])
                             .attr("target", "_win")
                             .attr("title", name);

        if (item["idx"] == _p["group"]) {
            title = name;
            if (item["start"] != null) start = item["start"];
            $(tmpObj).css("width", "18px");
        }
        $(group).append(tmpObj);
    })

    $(logoObj).append( $("<a>").addClass("title")
                                .attr("data-title", title)
                                .attr("data-start", start)
                                .attr("target", "_win")
                                .attr("href", "?.g=" + _p["group"])
                                .html(title)
    );

}

function renderMenu(obj) {

    var menu1 = "" ;
    var menuObj = $("#gm .menu");
    var level1 = {};
    var level2 = {};
    
    $.each(obj["data"], function(i, item) {

        if (menu1 != item["menu1"]) {

            $(menuObj).append(level1);
            level1 = $("<div>").addClass("level-1");

            var tmpObj = $("<a>").addClass("fnc-menu-1 att-text-size-auto").attr("href", "#").html(item["menu1"])
            if (item["share"] == 1) $(tmpObj).addClass("att-menu-common");
            $(level1).append(tmpObj);

            level2 = $("<div>").addClass("level-2");
            $(level1).append(level2);

            menu1 = item["menu1"];
        }

        var tmpObj = $("<a>").addClass("fnc-menu-2 att-text-size-auto")
            .attr("href", "#")
            .attr("data-g", item["grp"])
            .attr("data-i", item["idx"])
            .html(item["menu2"]);

        $(level2).append(tmpObj);
        
    });

    $(level1).append(level2);
    $(menuObj).append(level1);

    actMenu();
}


function renderPop1 (btnObj, mode="info") {

    initFnc["pop1"](btnObj);
    if (_p["device"] == "m") $("#pop1").width($("body").width());

    if ( mode == "info" ) {
        
        var infoStr = toHtml($(btnObj).attr("data-info"));
        $("#pop1 .space").html($("<div>").addClass("info").html(infoStr));

    } else if ( mode == "user" ) {

        $("#pop1 .head .title").html("change password");
        $("#pop1 .space").html(_htmls["chpwd"]);

    } else if ( mode == "execute" ) {

        var panelObj = getPanelObj(btnObj);
        var lines = renderFnc["formLine"](panelObj, btnObj);

        var btnAlias = "save";
        if ($(btnObj).attr("data-button-label")) btnAlias = $(btnObj).attr("data-button-label");

        var postData = {"post":"1"};
        if ($(btnObj).attr("data-force") == "1") postData["force"] = 1;

        var btn1 = getLinkObj( btnObj, "btn", 
            $(btnObj).attr("data-entity"), 
            $(btnObj).attr("data-mode"),
            $(btnObj).attr("data-target"),
            "", btnAlias, "att-width-140", postData);

        var body = $("<div>").addClass("body").html(lines);
        var tail = $("<div>").addClass("tail").html(btn1);
        var form = $("<div>").addClass("form").html($("<div>").addClass("formbox"));

        $(form).find(".formbox").css("display", "block").append(body).append(tail);
        $("#pop1 .space").html(form);

    } else if ( mode == "insert" ) {

        var panelObj = getPanelObj(btnObj);
        var insertObj = _p["p"]["i"][$("#pop1").attr("data-i")]["chart"]["insert"][$(btnObj).attr("data-target")];

        if ( insertObj["type"] && insertObj["type"] == "excel" ) {

            var customCols = {};

            customCols["@excel"] = {};
            customCols["@excel"]["name"] = "excel";
            customCols["@excel"]["type"] = "excel";
            customCols["@excel"]["input"] = "required";

            if (insertObj["add"]) {
                Object.keys(insertObj["add"]).forEach(key => {
                    customCols[key] = {};
                    customCols[key]["name"] = key;
                    customCols[key]["type"] = "string";
                    customCols[key]["input"] = "required";
                    if ( insertObj["add"][key]["alias"] ) customCols[key]["alias"] = insertObj["add"][key]["alias"];
                });
            }

            var lines = renderFnc["formLine"](panelObj, btnObj, customCols);

            var btnAlias = "save";
            if ($(btnObj).attr("data-button-label")) btnAlias = $(btnObj).attr("data-button-label");


            var btn1 = getLinkObj( btnObj, "btn", 
                $(btnObj).attr("data-entity"), 
                $(btnObj).attr("data-mode"),
                $(btnObj).attr("data-target"),
                $(btnObj).attr("data-type"),
                btnAlias, "att-width-140", {"post":"1", "method":"form"} );

            var body = $("<div>").addClass("body").html(lines);
            var tail = $("<div>").addClass("tail").html(btn1);
            var form = $("<div>").addClass("form").html($("<div>").addClass("formbox"));

            $(form).find(".formbox").css("display", "block").append(body).append(tail);
            $("#pop1 .space").html(form);

        } else {

            var lines = renderFnc["formLine"](panelObj, btnObj);

            var btnAlias = "save";
            if ($(btnObj).attr("data-button-label")) btnAlias = $(btnObj).attr("data-button-label");

            var btn1 = getLinkObj( btnObj, "btn", 
                $(btnObj).attr("data-entity"), 
                $(btnObj).attr("data-mode"),
                $(btnObj).attr("data-target"),
                "", btnAlias, "att-width-140", {"post":"1"} );

            var body = $("<div>").addClass("body").html(lines);
            var tail = $("<div>").addClass("tail").html(btn1);
            var form = $("<div>").addClass("form").html($("<div>").addClass("formbox"));

            $(form).find(".formbox").css("display", "block").append(body).append(tail);
            $("#pop1 .space").html(form);

            var addexcel = true;
            if ( insertObj["bulk"] === false ) addexcel = false;
            for ( colName in insertObj["columns"] ) {
                var colVal = insertObj["columns"][colName];
                if ( _p["p"]["i"][$("#pop1").attr("data-i")]["chart"]["heads"][colName]["display"] 
                    && _p["p"]["i"][$("#pop1").attr("data-i")]["chart"]["heads"][colName]["display"] == "file" ) {
                    addexcel = false;
                    break;
                }
            }

            if ( addexcel ) {
                var unit = $("<div>").addClass("unit");
                var unitHead = $("<div>").addClass("un-head");
                var unitBody = $("<div>").addClass("un-body");

                $(unit).append(unitHead).append(unitBody);

                $(unitHead).html(_m[_l]["bulk"]);

                var link1 = $("<a>").addClass("ut-link fnc-download-excel-sample").attr("href", "#").html(_m[_l]["excelsample"]);
                var link2 = $("<a>").addClass("ut-link fnc-download-excel-code").attr("href", "#").html(_m[_l]["excelcode"]);
                var input = $("<input>").addClass("att-input att-input-file").attr("type", "file").attr("accept", ".xlsx").html("file uplaod");
                $(unitBody).append(link1).append(link2).append("<hr/>").append(input);

                var btn = getLinkObj( btnObj, "btn", 
                    $(btnObj).attr("data-entity"), 
                    $(btnObj).attr("data-mode"),
                    $(btnObj).attr("data-target"),
                    "excel", "save", "att-width-140", {"target-sub":"bulk", "post":"1", "method":"form"} );
                $(unitBody).append(btn);

                $(form).find(".formbox").append(unit);
            }

            if ( _p["p"]["i"][$(panelObj).attr("data-i")]["chart"]["insert"][$(btnObj).attr("data-target")]["wizard"] === true ) {
                btn = getLinkObj(panelObj, "insert-tool", "chart", "insert", "", "tool", "panel starting tool (test)");
                $("#pop1 .space .form .formbox .body").append(btn);
            }

        }
        if (insertObj["conditions"]) {
            
            var customSearchObj = $(panelObj).find(".search .custom");
            var formObj = $("#pop1 .space .form .formbox .body");
            for ( var i=0; i<insertObj["conditions"].length; i++ ) {                
                var k = insertObj["conditions"][i];
                var v = $(customSearchObj).find(".item .value .att-input[data-name='"+k+"']").attr("data-value");
                $(formObj).find(".row .edit .att-input[data-name='"+k+"']").attr("data-value", v).val(v);
            }
        }

    } else if ( mode == "form" ) {

        var panelObj = getPanelObj(btnObj);
        var lines = renderFnc["formLine"](panelObj, btnObj);

        var btns = $("<div>");
        $.each(_p["p"]["i"][$(panelObj).attr("data-i")]["form"]["execute"], function(i, item) {

            var api = _p["const"]["execute"];
            if (item["api"]) api = item["api"];

            var alias = item["name"];
            if (item["alias"]) alias = item["alias"];

            var btn = getLinkObj( btnObj, "btn", "form", "execute", item["name"], "", alias, "att-width-140", { 
                "forward": item["forward"],
                "api": api,
                "post": "1"
            }); 
            $(btns).append(btn);
        })

        var body = $("<div>").addClass("body").html(lines);
        var tail = $("<div>").addClass("tail").html($(btns).html());
        var form = $("<div>").addClass("form").html($("<div>").addClass("formbox"));

        $(form).find(".formbox").css("display", "block").append(body).append(tail);
        $("#pop1 .space").html(form);
    }

    $("#pop1").toggle("slide", {direction:"right"}, 350);
    $("#pop1 .space").scrollTop(0);

}


function renderPop2 (obj) {

    var mode = $(obj).attr("data-mode");
    var pop2 = $("#pop2");
    
    $(pop2).hide();
    $(pop2).find(".head .title").html($(obj).attr("title"));    
    $(pop2).attr("data-target", $(obj).attr("data-target"));     
    $(pop2).attr("data-mode", mode);

    $(pop2).find(".head a[data-entity=pop2]").hide();

    if ( mode == "text" || mode == "markdown" ) {  
        $(pop2).find(".head a[data-mode=apply]").show();

    } else if ( mode == "json" ){
        $(pop2).find(".head a[data-entity=pop2]").show();

    } else if ( mode == "multi" ){
        $(pop2).find(".head a[data-mode=apply]").show();

    } else if ( mode == "search" ){
        $(pop2).find(".head a[data-mode=apply]").show();
    }

    if ( mode == "text" || mode == "markdown" ) {  

        var textStr = $(obj).next().find("textarea").val();
        var textarea = $("<textarea>").addClass("att-input att-input-textarea att-width-100p att-height-95p att-border-lightgray").val(textStr);

        $(pop2).find(".space").html(textarea);

    } else if ( mode == "json" ) {  
        
        $(pop2).find(".foot").html("* " + _m[_l]["dbclickmsg"]);    
        var jsonStr = $(obj).next().find("textarea").val();
        if (jsonStr == "") jsonStr = "{}";
        jsonStr = getHtmlEntity(jsonStr);
        $(pop2).find(".space").html($("<div>").attr("id", "editjson").html(jsonStr));
        callJsonEditor("editjson");

    } else if ( mode == "multi" ) {
        
        var panelId = $("#pop1").attr("data-i");
        var info = _p["p"]["i"][panelId]["chart"]["heads"][$(obj).attr("data-target")]
        var vals = $(obj).next().find("[data-name='" + $(obj).attr("data-target") + "']").attr("data-value").split(info["delimiter"]);

        var tabSize =  Object.values(info["values"]["data_rev"])[0].length;
        $(pop2).attr("data-tab",tabSize);
        $(pop2).find(".space").html("");

        if ( tabSize == 1 ) {

            var search = $("<div>").addClass("search").attr("data-depth", "1").attr("data-name", $(obj).attr("data-target"));
            
            $(search).append( $("<input>").addClass("att-input att-input-text fnc-pop2-search-box").attr("type", "text").attr("placeholder", "search") );

            $(search).append( getLinkObj( pop2, "btn", "pop2", "select",   "", "", "select all") );
            $(search).append( getLinkObj( pop2, "btn", "pop2", "delete",   "", "", "delete all") );
            $(search).append( getLinkObj( pop2, "btn", "pop2", "selected", "", "", "selected") );
            $(search).append( getLinkObj( pop2, "btn", "pop2", "reset",    "", "", "reset") );
            
            $(pop2).find(".space").html(search);

            var select = $("<div>").addClass("select fnc-selects");
            $.each(info["values"]["data"], function(k, v){
                var item = $("<a>").addClass("fnc-select-toggle").attr("href", "#").attr("data-value", v).html(k);
                if ( vals.indexOf(v+"") !== -1 ) item.addClass("att-selected-item");
                $(select).append(item);
            });

        } else {

            var search = $("<div>").addClass("search").attr("data-depth", "n").attr("data-name", $(obj).attr("data-target"));

            $(search).append( getLinkObj( pop2, "btn", "pop2", "select",   "", "", "select all") );
            $(search).append( getLinkObj( pop2, "btn", "pop2", "delete",   "", "", "delete all") );
            $(search).append( getLinkObj( pop2, "btn", "pop2", "reset",    "", "", "reset") );

            $(pop2).find(".space").html(search);

            var result = $("<div>").addClass("result").attr("data-name", $(obj).attr("data-target"));
            if ( $(obj).parent().attr("data-org") != "" ) {              
                $(result).html($(obj).parent().find(".edit .att-input-view").html());  
                $(result).find("div span").addClass("att-remove fnc-select-multi-remove");
            }

            $(pop2).find(".space").append(result);

            var tabWidth = 100/tabSize - 1 ;            
            var select = $("<div>").addClass("select fnc-tabs").attr("data-tab-size",tabSize);
            
            $(pop2).find(".space").append(select);

            var tab = [];

            for(var i=0; i<tabSize; i++) {
                tab[i] = $("<div>").addClass("tab fnc-selects").width(tabWidth+"%")
                                .attr("data-seq", i);
                $(select).append(tab[i]);

                if( i == 0) {
                    $.each(info["values"]["data"], function(k, v){

                        var item = $("<a>").addClass("fnc-select-one")
                                        .attr("href", "#")
                                        .attr("data-value", k)
                                        .attr("data-trigger","trgFnext")
                                        .html(k);
                        
                        $(tab[i]).append(item);
                    })
                }
            }
        }
        
        $(pop2).find(".space").append(select);
        $(pop2).attr("data-delimiter", info["delimiter"]);

    } else if ( mode == "search" ) {  

        $(pop2).attr("data-tab",1);
        $(pop2).find(".space").html("");

        var searchObj = _p["p"]["i"][$("#pop1").attr("data-i")]["chart"]["search"][$(obj).attr("data-target")];
        
        var query = $("<div>").addClass("query");

        var queryBox = $("<div>").addClass("box");
        $(queryBox).append( $("<input>").addClass("att-input att-input-text").attr("type", "text").attr("placeholder", "search") );
        $(queryBox).append( getLinkObj( pop2, "btn", "chart", "search", $(obj).attr("data-target"), "", "search", "", {"post": 1}) );

        var optionBox = $("<div>").addClass("option fnc-selects");
        if (searchObj["option"] && searchObj["option"]["data"]) {
            for (key in searchObj["option"]["data"]) {
                var val = searchObj["option"]["data"][key];
                var a = $("<a>").addClass("fnc-select-one")
                    .attr("href", "#")
                    .attr("data-name", searchObj["option"]["name"])
                    .attr("data-value", val)
                    .html(key);
                $(optionBox).append(a);
            }
            $(optionBox).find("a").eq(0).addClass("att-selected-item");
        }
 
        $(query).append(queryBox).append(optionBox);

        var search = $("<div>").addClass("search").attr("data-depth", "1").attr("data-name", $(obj).attr("data-target"));

        $(search).append( getLinkObj( pop2, "btn", "pop2", "select",   "", "", "select all") );
        $(search).append( getLinkObj( pop2, "btn", "pop2", "delete",   "", "", "delete all") );
        $(search).append( getLinkObj( pop2, "btn", "pop2", "selected", "", "", "selected") );
        
        var select = $("<div>").addClass("select fnc-selects");

        $(pop2).find(".space").append(query)
                              .append(search)
                              .append(select);
    } 

    $(pop2).toggle("slide", {direction:"right"}, 350);
    $(pop2).find(".space").scrollTop(0);

}

function renderPop3 (data, mode="sql", info) {
    
    var title = mode;
    if ( title == "markdown" ) title = "text (Markdown format)";
    
    $('#pop3').hide();
    $('#pop3').attr("data-mode", mode);
    $("#pop3 .head .title").html(title + " editor");
    $("#pop3 .head a").show();
    
    if ( mode == "sql" ) {
        $("#pop3").attr("data-mode", mode).attr("data-type", info["type"]).attr("data-source", info["idx"]);  
        sql = getHtmlEntity(data);      
        $("#pop3 .space").html($("<div>").attr("id", "editsql").html(sql));
        callSqlEditor("editsql", sql, info);

    } else if ( mode = "markdown" ) {
        $("#pop3 .head a.att-icon-align").hide();
        var textarea = $("<textarea>")
                .addClass("att-input att-input-textarea att-width-100p att-height-95p att-padding-top-bottom-10 att-border-lightgray")
                .attr("data-info", JSON.stringify(info))
                .val(data) ;
        $("#pop3 .space").html(textarea);
    }

    $("#pop3").toggle("slide", {direction:"right"}, 350);
    $("#pop3 .space").scrollTop(0);

    if ( info["idx"] ) renderPop4(sql, info); 
}

function renderPop4 (sql, info) {

    $("#pop4").attr("data-i", $("#pop1").attr("data-i"))
    $("#pop4").attr("data-g", $("#pop1").attr("data-g"))
    $("#pop4 .foot").html("* " + _m[_l]["queryrollback"]);

    var vars = {};
    var regex = /\$\{(.+?)\}|#\{(.+?)\}/g;

    var matches = sql.match(regex);

    if (matches) {
        var innerStrings = matches.map(function(match) {
            var fs = match.slice(2, -1);
            vars[fs]=1;
            return fs;
        });
    }

    var formbox = $("#pop4 .space .formbox").css("display", "block");
    var body = $(formbox).find(".body");
    $(body).html("");

    $.each(vars, function(k,v){

        var row = $("<div>").addClass("row  test-row");
        $(row).append($("<div>").addClass("label").html(k));

        var input = $("<input>").addClass("att-input att-input-text")
                                .attr("type", "text")
                                .attr("data-name", k);

        $(row).append($("<div>").addClass("edit").html(input));

        $(body).append(row);
    })
    
    $(formbox).find(".tail a").remove();
    var btn = getLinkObj ($("#pop4"), "btn", "pop4", "test", "", "", "test", "", {"run":"test", "post":1}) ;
    $(formbox).find(".tail").append(btn);

    $(formbox).find(".tail input[data-name=datasource]").attr("data-value", info["idx"]).val(info["idx"]);

    $("#pop4").toggle("slide", {direction:"right"}, 350);
    $("#pop4 .space").scrollTop(0);
}

function renderPop5 (sql, info) {

    initFnc["pop5"]();
    $("#pop5").toggle("slide", {direction:"right"}, 350);
}

function renderPop6 (btnObj, mode="view") {

    initFnc["pop1"](btnObj);
    initFnc["pop6"](btnObj);

    if (_p["device"] == "m") $("#pop6").width($("body").width());
    
    var space = $("#pop6 .space");
    var panelObj = getPanelObj(btnObj);
    var tdObj = $(btnObj).parent().parent();
    var trObj = $(tdObj).parent();

    $("#pop6 .head .fnc-view-edit").hide();

    var queryStr = "" ;
    var url = "";

    var paramObj = { 
        ".g": $(panelObj).attr("data-g"), 
        ".i": $(panelObj).attr("data-i"),
        ".v": $(btnObj).attr("data-view-id")
    };
    var keys = JSON.parse($(btnObj).attr("data-view-key"));

    for ( var k in keys ){
        var v = keys[k];
        var kVal = $(trObj).find("td[data-name='"+k+"']").attr("data-org");
        paramObj[v] = kVal;
    }

    for ( var k in paramObj ){
        var v = paramObj[k];
        queryStr += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(v);
    }

    url = _p["const"]["view"] + "?" + queryStr;
    callAjax ( url, function(resObj) {

        var viewType = "view";
        if (resObj["chart"]["type"]) viewType = resObj["chart"]["type"];

        $("#pop6 .head .title").html(resObj["title"]);
        var div = $("<div>").addClass("view");

        if ( viewType == "view" ) {
            var head = resObj["chart"]["heads"].map(head => head.name);
            for ( var row=0; row<1; row++ ) {
                for ( var i=0; i<resObj["chart"]["values"][row].length; i++ ) {
                    
                    val = resObj["chart"]["values"][row][i];
                    info = resObj["chart"]["heads"][i];

                    try {
                        var fncName = info["type"] + "T" + (info["display"] ? info["display"] : "") ;
                        var name = info["alias"] ? info["alias"] : info["name"];
                        if(info["unit"]) name += " (" + info["unit"] + ")";
                        var valHtml = renderFnc[fncName](head, info, $("<td>"),resObj["chart"]["values"][0], val) ;
                        //if ( info["parse"] ) valHtml = toHtml(val);
                    } catch(e) {
                        console.log(e);
                        modal( "no function or function error : " + fncName, false );
                        return;
                    }                 

                    var rowObj = $("<div>").addClass("row");
                    var labelObj = $("<span>").addClass("label").html(name);
                    var valueObj = $("<span>").addClass("value").html(valHtml);

                    $(div).append( $(rowObj).append(labelObj).append(valueObj) );

                    if (info["style"]) {
                        for ( var css in info["style"] ) {
                            $(valueObj).css(css, info["style"][css]);
                            if (info["link"] && info["link"]["type"] == "url") {
                                $(valueObj).find("a").css(css, info["style"][css]);
                            }
                        }
                    }
                }
            }
        } else if ( viewType == "list" ) {

            for ( var row=0; row<resObj["chart"]["values"].length; row++ ) {

                var keyIndex = resObj["chart"]["heads"].findIndex(obj => obj["name"] == "k");
                var valIndex = resObj["chart"]["heads"].findIndex(obj => obj["name"] == "v");

                var val = resObj["chart"]["values"][row][valIndex];
                var info = {"name":resObj["chart"]["values"][row][keyIndex],"type":"string"};

                try {
                    var fncName = info["type"] + "T" + (info["display"] ? info["display"] : "") ;
                    var name = info["alias"] ? info["alias"] : info["name"];
                    if(info["unit"]) name += " (" + info["unit"] + ")";
                    var valHtml = renderFnc[fncName](head, info, $("<td>"),resObj["chart"]["values"][0], val) ;
                } catch(e) {
                    console.log(e);
                    modal( "no function or function error : " + fncName, false );
                    return;
                }

                var rowObj = $("<div>").addClass("row");
                var labelObj = $("<span>").addClass("label").html(name);
                var valueObj = $("<span>").addClass("value").html(valHtml);

                $(div).append( $(rowObj).append(labelObj).append(valueObj) );

                if (info["style"]) {
                    for ( var css in info["style"] ) {
                        $(valueObj).css(css, info["style"][css]);
                        if (info["link"] && info["link"]["type"] == "url") {
                            $(valueObj).find("a").css(css, info["style"][css]);
                        }
                    }
                }
            }
        }
        $(space).html(div);
        $("#pop6").toggle("slide", {direction:"right"}, 350, function(){
            $(space).scrollTop(0);
        });
    });
      

}

function renderWorkplace(obj) {

    // all work place init
    $("#gw .panel").remove();
    _p["p"] = {"size":obj["data"].length, "i":{}};
    _p["chartObj"] = {};
    _p["scrollObj"] = {};
    widgetCharts = {};

    $.each(obj["data"], function(i, item) {

        var panelObj = $(_htmls["panel"])
        $(panelObj).attr("id", "pan" + item["idx"]);
        $(panelObj).attr("data-seq", i);
        $(panelObj).attr("data-g", item["grp"]);
        $(panelObj).attr("data-i", item["idx"]);
        $(panelObj).find(".head .title").html(item["title"]);
        $("#gw").append(panelObj);

        callPanel(panelObj);
    });
}

function renderPanel(obj) {

    if ( $("#pan" + obj["pid"]).length < 1) return;

    $("#gw .panel a.fnc-close-btn").click();
    $("#pop1 .head a.fnc-close-btn").click();
    
    var pid = obj["pid"];
    var panelId = "#pan" + pid;
    var panelObj = $(panelId);

    setPanelInfo(obj);
    var pinfo = _p["p"]["i"][pid];
    
    if (pinfo["chart"]) {
        $(panelObj).attr("data-entity", "chart");
    } else if (pinfo["form"]) {
        $(panelObj).attr("data-entity", "form");
    }

    if (pinfo["widget"]) {
        $(panelObj).find(".widget").show();
    }

    if (pinfo["chart"]) {
        $(panelObj).find(".search").css("display", "flex");
        $(panelObj).find(".search .act").remove();
        $(panelObj).find(".chart").show();
    }
    if (pinfo["form"]) {
        $(panelObj).find(".form").show();
    }

    if (pinfo["chart"]) {
        $(panelObj).attr("data-type", pinfo["chart"]["type"]);
    }

    $(panelObj).find(".pidxinfo").attr("id", getUniqueId());
    $(panelObj).find(".pidxinfo .row .val").html(pid);

    $(panelObj).find(".head .update").html("");
    if (pinfo["chart"] && pinfo["chart"]["last_update"])
        $(panelObj).find(".head .update").append(" " + _m[_l]["updated"] + ": " + pinfo["chart"]["last_update"]);

    // tools rendering
    var toolObj = $(panelObj).find(".head .tools");
    $(toolObj).html("");

    var btn;

    if (pinfo["info"]) {

        btn = getLinkObj(panelObj, "tool", "chart", "heads", "", "info", "info", "att-tool-info", {"info": pinfo["info"]});
        $(toolObj).append(btn);
    }

    btn = getLinkObj(panelObj, "tool", "chart", "heads", "", "reload", "reload", "att-tool-reload");
    $(toolObj).append(btn);

    if (pinfo["chart"]) {
        btn = getLinkObj(panelObj, "tool", "chart", "heads", "", "excel", "excel", "att-tool-excel");
        $(toolObj).append(btn);
    }

    if (pinfo["chart"] && pinfo["chart"]["dchart"]) {
        btn = getLinkObj(panelObj, "tool", "chart", "table", "", "chart", "chart", "att-tool-chart");        
        $(toolObj).append(btn);
    }

    if (pinfo["chart"] && pinfo["chart"]["operate"]) {

        $.each(pinfo["chart"]["operate_orders"], function(i, name) {

            var item = pinfo["chart"]["operate"][name];
            
            var alias = item["name"];
            if (item["alias"]) alias = item["alias"];
            btn = getLinkObj(panelObj, "tool", "chart", "operate", item["name"], item["type"], alias, "att-tool-table att-select-group");        
            $(toolObj).append(btn);
        });

        $(toolObj).append(btn);
    }

    if (pinfo["chart"] && pinfo["chart"]["execute"]) {

        $.each(pinfo["chart"]["execute_orders"], function(i, name) {

            var item = pinfo["chart"]["execute"][name];
            
            var alias = item["name"];
            if (item["alias"]) alias = item["alias"];
            
            btn = getLinkObj(panelObj, "tool", "chart", "execute", item["name"], item["type"], alias, "att-tool-custom att-disable");
            if (item["button_label"]) $(btn).attr("data-button-label", item["button_label"]);
            if (item["force"]) $(btn).attr("data-force", "1");
            if(item["display"] === "hide") btn.addClass("att-hidden");

            $(toolObj).append(btn);
        });
    }
    if (pinfo["chart"] && pinfo["chart"]["insert"]) {

        $.each(pinfo["chart"]["insert_orders"], function(i, name) {
            
            var item = pinfo["chart"]["insert"][name];
            
            var alias = item["name"];
            if (item["alias"]) alias = item["alias"];

            if (!item["type"]) item["type"] = "";
            
            btn = getLinkObj(panelObj, "tool", "chart", "insert", item["name"], item["type"], alias, "att-tool-new");
            if (item["button_label"]) $(btn).attr("data-button-label", item["button_label"]);

            $(toolObj).append(btn);
        });
    }

    if (pinfo["action"] && _p["device"] == "p") {

        $(panelObj).find(".action").show();
        renderPanelAction(panelObj, obj);
    }

    if (pinfo["form"]) {
        renderPanelForm(panelObj, obj);

    } else {

        // custom search rendering
        var customObj = $(panelObj).find(".search .custom");
        $(customObj).html("");

        if (pinfo["chart"] && pinfo["chart"]["conditions"]) {

            var dateItem ;
            $.each(pinfo["chart"]["conditions"], function(k,v) {

                var item = $("<div class='item'><div class='label'></div><div class='value'></div></div>");

                var searchName = k;
                if (searchName == "@date") searchName = ".date";
                
                var initValue = getHashParamValue(panelId, searchName);
                if (initValue == "" && v["default"]) initValue = v["default"] ;
                
                var prtValue = initValue;
                if (prtValue == "") prtValue = "none";

                var label = k;
                if (v["alias"]) label = v["alias"];

                if (k == "@date") {

                    dateItem = item;
                    $(dateItem).find(".label").addClass("date");
                    $(dateItem).find(".value").append( $("<a>").addClass("fnc-date-pick")
                                                            .attr("href", "#")
                                                            .attr("title", "date")
                                                            .attr("data-name", "@date")
                                                            .attr("data-value", initValue)
                                                            .html(prtValue)
                    );
                } else if (v["values"] && v["values"]["data"]) {

                    $(item).find(".label").html(label);

                    var select  = $("<select>").addClass("att-input att-input-select")
                                               .attr("data-name", k)
                                               .attr("data-value", initValue)
                                               .append($("<option>").attr("value", "").html("none"));

                    $(item).find(".value").append(select);

                    $.each(v["values"]["data"], function(kk,vv) {
                        var tmpObj = $("<option>").attr("value",vv).html(kk)
                        $(item).find(".value select").append(tmpObj);
                    });
                    $(select).find('option[value="' + initValue + '"]').prop("selected", true);


                    $(customObj).append(item);
                } else {
                    $(item).find(".label").html(label);
                    $(item).find(".value").append( $("<input>").addClass("att-input att-input-text")
                                                                .attr("data-name", k)
                                                                .attr("data-value",initValue)
                                                                .val(initValue)
                    );
                    $(customObj).append(item);
                }
            });

            if (dateItem) $(customObj).append(dateItem);
        } else {
            if ( _p["device"] == "m" ) $(customObj).next().find("a[data-target=search]").hide();
        }

        if ( pinfo["widget"] ) {
            renderPanelWidget(panelObj, obj);
        }

        if ( pinfo["chart"] ) {

            $.each(pinfo["chart"]["heads_orders"], function (i, col){

                if (pinfo["chart"]["heads"][col]["cumulative"] === true) {

                    var sum = 0;
                    $.each(obj["chart"]["values"], function(j,row) {
                        var thisVal = row[i] ? row[i] : 0 ;
                        obj["chart"]["values"][j][i] = thisVal + sum;
                        sum += thisVal;
                    })
                }
            });

            if ( pinfo["chart"]["type"] == "table" ) {
                if (pinfo["chart"]["list"] && pinfo["chart"]["list"]["type"] == "page") {
                    if ( pinfo["chart"]["list"]["page_total"] > 0 ) {
                        if (pinfo["chart"]["list"]["page"] > pinfo["chart"]["list"]["page_total"]) {
                            $(panelObj).find(".head .tools .att-tool-reload").click();
                            return;
                        }
                    }
                }
                renderPanelTable(panelObj, obj);
            }

            if ( pinfo["chart"]["type"] == "chart" ) {
                renderPanelChart(panelObj, obj);
            }

            if ( pinfo["chart"]["note"] ) {

                var note = $(panelObj).find(".note");
                $(note).html("");
                for ( var i=0 ; i < pinfo["chart"]["note"].length ; i ++ ) {

                    var str = pinfo["chart"]["note"][i]["text"];
                    $.each ( pinfo["chart"]["note"][i]["data"], function(k,v){
                        str = str.replaceAll( "{" + "{" + "{" +k+"}}}", "<span class='att-highlight'>" + v + "</span>" );
                    });
                    var row = $("<div>").addClass("row").html(str);
                    $(note).append(row);
                }
                $(note).css("display", "block");
            }
        }
    }

    $(panelObj).find(".progress").hide();
}


function renderPanelChart(panelObj, obj) {

    var pid = $(panelObj).attr("data-i")
    var cinfo = _p["p"]["i"][pid]["chart"];

    if ( !cinfo["chart"] ) cinfo["chart"] = {};

    var chartInfo = {
        "id" : pid,
        "class" : "chart",
        "height" : obj["chart"]["height"] ? obj["chart"]["height"] : null,
        "heads_orders" : cinfo["heads_orders"],
        "heads" : cinfo["heads"],
        "values" : obj["chart"]["values"],
        "stack": cinfo["chart"]["stack"] ? cinfo["chart"]["stack"] : null,
        "pivot" : obj["chart"]["pivot"] ? obj["chart"]["pivot"] : null,
        
    }

    renderFnc["renderChart"](panelObj, chartInfo);
}


function renderPanelTable(panelObj, obj) {

    var chartObj = $(panelObj).find(".chart");
    var chart = $("<div>").addClass("chart-table");
    var table = $("<table>").addClass("table");

    var pid = $(panelObj).attr("data-i");
    var cinfo = _p["p"]["i"][pid]["chart"];

    if (cinfo["height"]) $(chart).css("max-height", cinfo["height"] + "px");

    // table head render start
    var tr = $("<tr>");
    $.each(cinfo["heads_orders"], function(i,name) {

        var item = cinfo["heads"][name];
        var th = $("<th>");
        $(th).attr("data-key", item["name"]);
        $(th).attr("data-type", item["type"]);
        $(th).attr("data-display", item["display"]);
        if ( item["display"] == "key" ) $(th).addClass("att-key")
        else if ( item["display"] == "hide" ) $(th).addClass("att-hidden")

        if (item["point"]) $(th).attr("data-point", item.point);

        if (item["alias"]) $(th).html($("<span>").addClass("name").html(item["alias"]));
        else  $(th).html($("<span>").addClass("name").html(item["name"]));

        if (item["unit"]) $(th).append($("<span>").addClass("unit").html("("+item["unit"]+")"));

        $(tr).append(th);
    });
    $(table).append(tr);
    // table head render end

    // table body render start
    var lines = renderFnc["tableLine"](panelObj, obj);
    $(table).append(lines);

    // summary render start
    var tr = $("<tr>").addClass("summary");
    var hasSummary = false;
    $.each(cinfo["heads_orders"], function(i,name) {

        var item = cinfo["heads"][name]
        var td = $("<td>");
        if (item["summary"]) {
            hasSummary = true;
            if (item["summary"] == "cnt") $(td).addClass("att-summary-cnt").attr("data-summary", "cnt");
            else if (item["summary"] == "sum") $(td).addClass("att-summary-sum").attr("data-summary", "sum");
            else if (item["summary"] == "avg") $(td).addClass("att-summary-avg").attr("data-summary", "avg");
            if (item["summary_calc"]) $(td).attr("data-summary-calc", item["summary_calc"]);
        }

        if (item["display"] && item["display"] == "key") $(td).addClass("att-key");
        else if (item["display"] && item["display"] == "hide") $(td).addClass("att-hidden");
        
        $(td).attr("title", name);
        $(tr).append(td);
    });
    if (hasSummary) $(table).append(tr);
    else $(table).append($(tr).addClass("att-hidden"));
    // summary render end

    $(chart).append(table);

    try {
        $(chartObj).html(chart);
    } catch (e) {
        console.log(e)
    }


    renderFnc["tableSummary"](panelObj);

    if (cinfo["list"]) {

        if (cinfo["list"]["type"] == "scroll") {
            _p["scrollObj"][$(panelObj).attr("id")] = 
                new ScrollTrigger($(panelObj).attr("id"), { keys:cinfo["list"]["keys"], size:cinfo["list"]["size"] });

        } else if (cinfo["list"]["type"] == "page" && cinfo["list"]["page_total"] > 0) {

            var pageObj =$("<div>").addClass("page");

            var offsetVal = 0 ;
            var groupSize = 5;
            var start = groupSize * (Math.floor((cinfo["list"]["page"]-1) / groupSize)) + 1;
            
            var prevOffset = start - 1;
            prevOffset = prevOffset > 0 ? (prevOffset-1) * cinfo["list"]["size"] : 0 ;

            var nextOffset = start + groupSize;
            nextOffset = nextOffset < cinfo["list"]["page_total"] ? 
                (nextOffset-1) * cinfo["list"]["size"] : (cinfo["list"]["page_total"]-1) * cinfo["list"]["size"] ;

            var link;
            link = $("<a>").addClass("fnc-link-page num").attr("href", "#")
                .attr("data-offset",0).html("first");
            $(pageObj).append(link); 

            link = $("<a>").addClass("fnc-link-page num").attr("href", "#")
                .attr("data-offset",prevOffset).html("prev");
            $(pageObj).append(link);

            $(pageObj).append($("<span>").addClass("num").html(".")); 
            for (var i=start; i<start+groupSize; i++) {
                var offset = (i-1) * cinfo["list"]["size"];
                var num = i;
                if ( num > cinfo["list"]["page_total"] ) break;

                link = $("<a>").addClass("fnc-link-page num").attr("href", "#").attr("data-offset",offset)
                    .html(numberFormat(num));
                if(cinfo["list"]["page"] == num) {
                    $(link).addClass("att-highlight");
                    offsetVal = offset;
                }
                
                $(pageObj).append(link); 
            }
            $(pageObj).append($("<span>").addClass("num").html(".")); 

            link = $("<a>").addClass("fnc-link-page num").attr("href", "#").attr("data-offset",nextOffset).html("next");
            $(pageObj).append(link); 

            link = $("<a>").addClass("fnc-link-page num").attr("href", "#")
                .attr("data-offset",(cinfo["list"]["page_total"]-1)*cinfo["list"]["size"])
                .html("last (" + numberFormat(cinfo["list"]["page_total"]) + " page)");
            $(pageObj).append(link); 

            $(chartObj).append(pageObj);

            var customObj = $("<div class='item att-hidden'><div class='value'></div></div>");
            var dataObj = $("<input>").attr("data-name", ".o").attr("data-value", offsetVal);
            $(customObj).find(".value").append(dataObj);
            $(panelObj).find(".search .custom").append(customObj);

        } else if (cinfo["list"]["type"] == "group") {

            var boldWeight = 1;
            for (var i=cinfo["list"]["columns"].length-2; i>=0; i--) {

                var col = cinfo["list"]["columns"][i];
                var preVal = "";

                $(table).find("tr.row td[data-name='"+col+"']").each( function(j, item){
                    if ($(item).attr("data-org") == preVal) {
                        $(item).find(".value").html("");
                    }
                    else {
                        preVal = $(item).attr("data-org");
                        if ( i==0 ) {
                            $(item).parent().find("td").css("border-top", boldWeight + "px solid gray");
                        } else if ( i==1 ) {
                            $(item).parent().find("td").css("border-top", boldWeight + "px dotted gray");
                        } 
                    }
                });

                boldWeight ++;
            }
        }
    }
}


function renderPanelAction(panelObj, obj) {

    var actionObj = $(panelObj).find(".action");
    $(actionObj).html("");
    for (var i=0; i<obj["action"].length; i++) {
        
        var item = obj["action"][i];
        var name = item["name"];
        if ( item["alias"] ) name = item["alias"];

        var btn = getLinkObj(panelObj, "btn", "action", "execute", item["name"], "", name, 
            "att-width-160 att-margin-bottom-10", 
            { "post":1 } 
        );  
        if (item["conditions"]) {

            var requiredKeys = Object.keys(item["conditions"]).filter(
                key => item["conditions"][key]["input"] && item["conditions"][key]["input"] === "required"
            );
            $(btn).attr("data-required", JSON.stringify(requiredKeys));
        }
    

        $(actionObj).append(btn)
    }
}

function renderPanelForm(panelObj, obj) {

    var pid = $(panelObj).attr("data-i");
    var formObj = $(panelObj).find(".form");
    var finfo = _p["p"]["i"][pid]["form"];

    if (finfo["info"]) $(formObj).find(".info").html( toHtml(finfo["info"]) );
    var btn = getLinkObj(panelObj, "btn", "form", "execute", finfo["name"], "", finfo["name"],  "att-width-140" );  
    $(formObj).find(".result").html("");

    $(formObj).find(".body").html(btn);
    $(formObj).show();
}

function renderPanelWidget(panelObj, obj) {

    var pid = $(panelObj).attr("data-i");
    var widgetObj = $(panelObj).find(".widget").html("");
    var winfo = _p["p"]["i"][pid]["widget"];

    for (var i=0; i<winfo.length; i++) {

        var witem = winfo[i];

        if ( witem["type"] == "index" ) {

            var widget = $(_htmls["widget"]);
            $(widgetObj).append(widget);
            renderPanelWidgetIndex(widget,witem, panelObj, obj);

        } else if ( witem["type"] == "chart" ) {

            var widget = $(_htmls["widget"]);
            $(widgetObj).append(widget);
            renderPanelWidgetChart(widget,witem, panelObj, obj);

        } else if ( witem["type"] == "list" ) {

            var widget = $(_htmls["widget-list"]);
            $(widgetObj).append(widget);
            renderPanelWidgetList(widget,witem, panelObj, obj);
        }

    }

}


function renderPanelWidgetIndex (widget, witem, panelObj, obj) {

    var base = witem["data"]["base"];
    var target = witem["data"]["target"];
    var diff = target - base;
    var rate = diff / base * 100 ;
    var prefix = ( witem["unit"] ? witem["unit"] + " " : "" );
    var info = witem["info"];
    var point = ( witem["point"] ? witem["point"] : 0 );
    var cls = ( diff > 0 ? "plus" : "minus" );

    $(widget).find(".header a").html(witem["name"]);
    $(widget).find(".body .index").html( prefix + numberFormat(target, point) );
    $(widget).find(".body .cap .base").html(prefix + numberFormat(base, point) );
    $(widget).find(".body .cap .diff").addClass(cls).html( prefix + numberFormat(diff, point) );
    $(widget).find(".body .cap .rate").addClass(cls).html( numberFormat(rate, 2) );
    $(widget).find(".footer .comment").html(info).attr("data-noti", JSON.stringify(witem["signal"]));

    if ( ( witem["signal"]["red"]["compare"] == "lt" && rate < witem["signal"]["red"]["value"] )
        || ( witem["signal"]["red"]["compare"] == "gt" && rate > witem["signal"]["red"]["value"] )
    ) {
        $(widget).find(".body div.index").eq(0).addClass("red");

    } else if ( ( witem["signal"]["yellow"]["compare"] == "lt" && rate < witem["signal"]["yellow"]["value"] ) 
        || ( witem["signal"]["yellow"]["compare"] == "gt" && rate > witem["signal"]["yellow"]["value"] )
    ) {
        $(widget).find(".body div.index").eq(0).addClass("yellow");

    } else {
        $(widget).find(".body div.index").eq(0).addClass("green");
    }

    if (witem["link"]) {
        $(widget).find(".header a").addClass("att-outlink").attr("href", witem["link"][0]).attr("target","_blank");

        for ( var j=1; j < witem["link"].length; j++ ) {
            var link = $("<a>").addClass("att-outlink").attr("href", witem["link"][j]).attr("target","_blank").html("&nbsp;");
            $(widget).find(".header").append(link);
        }
    }
}

var widgetCharts = {}
function renderPanelWidgetChart (widget, witem, panelObj, obj) {

    var canvasId = getUniqueId();
    var canvas = $("<canvas>").attr("id", canvasId);
    
    $(widget).find(".chart-area").html(canvas);
    $(widget).find(".chart-area").css("display", "block");

    var baseSum = 0 ;
    var targetSum = 0 ;

    var chartTarget = [];
    var chartBase = [];
    var chartLabels = [];

    for ( var i = 0; i < witem["data"]["base"].length; i++ ) {

        baseVal = witem["data"]["base"][i]["y"];
        baseSum += baseVal;

        if (witem["data"]["target"][i]) targetVal = witem["data"]["target"][i]["y"];
        else targetVal = 0;
        targetSum += targetVal;
    
        if (witem["data"]["target"][i]) label = witem["data"]["target"][i]["x"];
        else label = "none";

        value = targetSum - baseSum;
        if ( witem["cumulative"] === false ) value = targetVal - baseVal;
        chartTarget.push({"x":label, "y":value});
        chartBase.push({"x":label, "y":0})
        chartLabels.push(label);
    }

    witem["data"]["base"] = baseSum;
    witem["data"]["target"] = targetSum;
    renderPanelWidgetIndex (widget,witem, panelObj, obj);

    var baselineColor = "lightgray";
    var targetBgColor = "mediumaquamarine";
    if ( (targetSum - baseSum) < 0 ) {
        targetBgColor = "lightcoral";
    }

    var dataSets = [
        {
            lavel: "b",
            data: chartBase,
            fill: true,
            borderWidth: 1,
            pointRadius: 0,
            pointHoverRadius: 0,
            borderColor: baselineColor
        },
        {
            lavel: "y",
            data: chartTarget,
            fill: true,
            borderWidth: 0,
            pointRadius: 0,
            pointHoverRadius: 0,
            backgroundColor: targetBgColor
        }
    ];

    var ctx = document.getElementById(canvasId).getContext("2d");
    var cfg = {
        type: "line",
        data: {
            labels: chartLabels,
            datasets: dataSets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {legend: {display: false}},
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    };
    widgetCharts[canvasId] = new Chart(ctx,cfg);
}


function renderPanelWidgetList (widget, witem, panelObj, obj) {

    $(widget).find(".header a")
        .addClass("att-outlink-white")   
        .attr("target", "_blank")
        .html(witem["name"]);

    if (witem["link"] && witem["link"][0] != "")
        $(widget).find(".header a").attr("href", witem["link"][0]);

    var link_type = "" ;
    var link_col = "" ;
    var link_info;

    for ( var key in witem["list"] ) {
        
        var thisItem = witem["list"][key];
        if (thisItem["link"] && thisItem["link"]["type"] == "view") {
            link_type = thisItem["link"]["type"];
            link_col = thisItem["name"];
            link_info = thisItem["link"]["rule"];
            break;
        }
    }

    var listCnt = 3;
    var list = $(widget).find(".list");
    for (var i=0; i<witem["data"].length; i++) {
        if (i==listCnt) break;

        var row = witem["data"][i];
        var tr = $("<tr>");
        var tdObj = {};
        for (var key in row) {
            
            val = witem["data"][i][key];
            var td = $("<td>").attr("data-org", val).attr("data-name", key);
            if (link_col == key) {
                var link = $("<a>").addClass("item")
                    .attr("href", "#")
                    .attr("data-entity", "chart")
                    .attr("data-mode", "view")
                    .html(val);
                
                if (link_type == "url") {
                    // todo
                } else if (link_type == "view") {
                    $(link).addClass("fnc-link viewlink")
                           .attr("data-view-id", link_info["id"])
                           .attr("data-view-key", JSON.stringify(link_info["key"]));
                }
                $(td).html($("<span>").html(link));
            } else {
                $(td).html(val);
            }
            tdObj[key] = td;
        }

        var td1 = tdObj[witem["list"]["col1"]["name"]].addClass("td1");
        $(tr).append(td1);
        delete (tdObj[witem["list"]["col1"]["name"]]);
    
        var td2 = tdObj[witem["list"]["col2"]["name"]].addClass("td2");
        $(tr).append(td2);
        delete (tdObj[witem["list"]["col2"]["name"]]);

        for ( var key in tdObj ) $(tr).append( tdObj[key].addClass("att-key") );

        $(list).append(tr);
    }
}


function renderDataUpdate (panelObj, obj) {

    _p["p"]["i"][obj["pid"]]["chart"]["just_execute"] = obj["execute"];

    callPanelCustom (panelObj, function(dataObj) {

        var panelObj = $("#pan" + dataObj["pid"]);
        var rows = $(panelObj).find(".chart .chart-table .table .row");

        if (dataObj["chart"]["values"].length == 0) {
            removeEffectRow($(rows));
            return;
        }

        var updatedList = _p["p"]["i"][obj["pid"]]["chart"]["just_execute"];
        
        var dataMatchedRow = [];
        var usedExecute = {};
        for( var i=0; i<dataObj["chart"]["values"].length; i++ ) {

            if (updatedList) {

                for ( var j=0; j<updatedList.length; j++ ) {

                    usedExecute[j+""] = 1;
                    updateCols = updatedList[j];
                    
                    var matched = true;
                    var selectorArr = [];
                    $.each(updateCols, function(k, v) {
                        if ( v != getpanelResValue(dataObj, "a", i, k) ) {
                            matched = false;
                            return;
                        }
                        selectorArr.push("td[data-name='"+k+"'][data-org='"+v+"']")
                    });
                    if ( matched ) {
                        dataMatchedRow.push({"index":i, "index_exec":j, "selector":selectorArr});
                    }
                }
            }
        }

        for( var i=0; i<dataMatchedRow.length; i++ ) {
            
            var item = dataMatchedRow[i];
            var target = $(rows).find(item["selector"][0]).parent();

            if ( item["selector"].length > 1 ) {
                for (var j=1; j<item["selector"].length; j++) {
                    target = $(target).find(item["selector"][j]).parent();
                }
            }

            delete(usedExecute[item["index_exec"]]);

            if ( target.length > 0 ) {

                var rowObj = {};
                rowObj["chart"] = {};
                rowObj["chart"]["values"]=[];
                rowObj["chart"]["values"].push(dataObj["chart"]["values"][item["index"]]);

                var rowObjNew = renderFnc["tableLine"](panelObj, rowObj); 

                $(target).html($(rowObjNew).html());
                highlightEffectRow($(target));
            }
        }

        $.each(usedExecute, function(k,v){
            item = _p["p"]["i"][obj["pid"]]["chart"]["just_execute"][k]
            var selectorArr = [];
            $.each(item, function(k, v) {
                selectorArr.push("td[data-name='"+k+"'][data-org='"+v+"']")
            });

            $(rows).each(function(s, o){
                
                var isMatched = true;
                for (var j=0; j<selectorArr.length; j++) {
                    if ( $(o).has(selectorArr[j]).length == 0 ) {
                        isMatched = false;
                        break;
                    }
                }
                if ( isMatched ) removeEffectRow($(o));
            });
        })

        delete(_p["p"]["i"][obj["pid"]]["chart"]["just_execute"]);
    });
}

function convertPythonToJsCondition(pythonCondition) {
    // Mapping of Python operators to JavaScript operators
    const operatorMap = {
        "and": "&&",
        "or": "||",
        "==": "===",
        "!=": "!==",
        "None": "null",
    };

    // Regular expression to identify string literals (single/double quotes)
    const stringLiteralPattern = /(['"])(?:\\.|[^\\])*?\1/g;

    // Find all string literals and store them
    const stringLiterals = [];
    pythonCondition = pythonCondition.replace(stringLiteralPattern, (match) => {
        const placeholder = `__STRING_LITERAL_${stringLiterals.length}__`;
        stringLiterals.push(match);
        return placeholder;
    });

    // Replace Python operators with JavaScript operators
    for (const [pyOp, jsOp] of Object.entries(operatorMap)) {
        const regex = new RegExp(`\\b${pyOp}\\b`, "g");
        pythonCondition = pythonCondition.replace(regex, jsOp);
    }

    // Restore string literals
    stringLiterals.forEach((literal, idx) => {
        const placeholder = `__STRING_LITERAL_${idx}__`;
        pythonCondition = pythonCondition.replace(placeholder, literal);
    });

    return pythonCondition;
}

function isActionCondition (colsInfo, actionInfo, values) {

    if (!actionInfo["condition"]) return true;

    // "condition":{"case":"...."}
    if ( "case" in actionInfo["condition"] ) {
        var caseStr = actionInfo["condition"]["case"];
        for (var i in colsInfo["heads_orders"]) {
            var item = colsInfo["heads_orders"][i];
            item = "${" + item + "}"
            caseStr = caseStr.replace(item, values[i]);
        }
        caseStr = convertPythonToJsCondition(caseStr);
        return eval(caseStr);
    }

    // "condition":{"column":"type","operand":"eq","value":"0201"}
    var column = actionInfo["condition"]["column"] ? actionInfo["condition"]["column"] : "" ;
    var operand = actionInfo["condition"]["operand"] ? actionInfo["condition"]["operand"] : "eq" ;
    var tarVal = null;
    if ( "value" in actionInfo["condition"] && actionInfo["condition"] != null ) 
        tarVal = actionInfo["condition"]["value"];
    
    if ( column == "" || operand == "" || tarVal == null ) return false;
   
    var index = colsInfo["heads_orders"].indexOf(column);
    var realVal = values[index];

    if ( operand == "eq" ) { if (realVal == tarVal) return true; }
    else if ( operand == "neq" ) { if (realVal != tarVal) return true; }
    else if ( operand == "gt" ) { if (realVal > tarVal) return true; }
    else if ( operand == "lt" ) { if (realVal < tarVal) return true; }
    else if ( operand == "in" ) { if (tarVal.includes(realVal)) return true; } // in case of array
    
    return false;
}

function highlightEffectRow(obj) {

    $(obj).append(_htmls["highlight-row"])
    $(obj).find(".att-highlight-row").height($(obj).height());

    $($(obj).find(".att-highlight-row")).fadeOut( 1000, function() {        
        $(this).remove();
    });

}

function removeEffectRow(obj) {

    $(obj).fadeOut( 1000, function() {
        $(obj).remove();
    });
}

function toHtml(str) {

    var div = $("<div>").addClass("markdown-body").html(marked.parse(str));

    $(div).find("a").addClass("att-color-dodgerblue").attr("target", "_blank");
    $(div).find("strong").addClass("att-highlight");
    $(div).find("em").addClass("att-highlight");
    
    return div;
}


var renderFnc = {

    tableLine: function(panelObj, obj) {

        var table = $("<table>");
        var cinfo = _p["p"]["i"][$(panelObj).attr("data-i")]["chart"];

        $.each(obj["chart"]["values"], function(i,row) {

            var tr = $("<tr>").addClass("row stripe");
            $.each(row, function(j,val) {
                
                var cName = cinfo["heads_orders"][j];
                var info = cinfo["heads"][cName];
                info["@data-i"] = $(panelObj).attr("data-i");

                var td = $("<td>").attr("data-org", val).attr("data-name",cName);
                var div =$("<div>").addClass("value");

                if ( "default" in info ) {  
                    if ( info["default"] == undefined ) {
                        $(td).attr("data-default-null", "");
                    }
                }

                $(td).append(div);
                
                // val == white space : data-org attribute exist
                // val == null : data-org attribute not exist
                try {
                    var fncName = info["type"] + "T" + (info["display"] ? info["display"] : "");
                    val = renderFnc[fncName](cinfo["heads_orders"], info, td, row, val);
                } catch(e) {
                    console.log(e);
                    modal( "no function or function error : " + fncName, false );
                    return;
                }
                if (info["align"]) $(div).addClass("att-align-"+info["align"]);
                if (info["style"]) {
                    for (var styleKey in info["style"]) {
                        $(div).css(styleKey, info["style"][styleKey]);
                        if (info["link"] && info["link"]["type"] == "url") {
                            $(div).find("a").css(styleKey, info["style"][styleKey]);
                        }
                    }
                }

                $(div).html(val);

                if (info["action"]) {    
                    var is_condition = isActionCondition (cinfo, info["action"], row);
                    if (is_condition) {
                        var a = getLinkObj(null, "action-link", "chart", "action", info["action"]["target"] , "", info["action"]["name"] );
                        $(div).append(a);
                    }
                }

                $(tr).append(td);
            });

            $(table).append(tr);
        });
        return $(table).find("tr");
    },

    tableSummary: function(panelObj) {

        var tableObj = $(panelObj).find(".chart .chart-table .table");
        
        var pid = $(panelObj).attr("data-i");
        var headsArr = _p["p"]["i"][pid]["chart"]["heads_orders"];
        var headsObj = _p["p"]["i"][pid]["chart"]["heads"];

        if ($(tableObj).find("tr.summary td[data-summary]").length > 0) {

            var trObj = $(tableObj).find("tr.row:visible");
            var viewCnt = $(trObj).length;

            var cols = {}

            $(tableObj).find('tr.summary td').each(function(i,e) {

                if ( !$(e).attr("data-summary-calc") ) {

                    if ($(e).attr("data-summary") == "cnt") {
                        $(e).html(viewCnt);
                        cols[$(e).attr("title")] = viewCnt;

                    } else if ($(e).attr("data-summary") == "sum" || $(e).attr("data-summary") == "avg" ) {
                        
                        var sum = 0;
                        $.each(trObj, function(j,tr) {
                            if ($(tr).find("td").eq(i).attr("data-org"))
                                sum += parseFloat($(tr).find("td").eq(i).attr("data-org"));
                        })

                        var printVal;
                        if ($(e).attr("data-summary") == "sum") {
                            
                            printVal = renderFnc["numberT"](headsArr, headsObj[$(e).attr("title")], {}, [], sum);  
                            cols[$(e).attr("title")] = sum; 
                        } else {
                            printVal = renderFnc["numberT"](headsArr, headsObj[$(e).attr("title")], {}, [], sum/viewCnt); 
                            cols[$(e).attr("title")] = sum/viewCnt;   
                        }
                        $(e).html(printVal);
                    }
                }
            });

            $(tableObj).find('tr.summary td[data-summary-calc]').each(function(i,e) {

                var calcStr = $(e).attr("data-summary-calc");
                $.each(cols, function(colName, colVal){
                    calcStr = calcStr.replaceAll("${"+colName+"}", colVal )
                });

                calcVal = eval(calcStr);
                printVal = renderFnc["numberT"](headsArr, headsObj[$(e).attr("title")], {}, [], calcVal); 
                $(e).html(printVal);
            });
        }
    },

    formLine: function(panelObj, obj, customObj = null) {

        var columns;
        var pid = $(panelObj).attr("data-i")
        var startObj = _p["p"]["i"][pid];

        if ( customObj ) {
            columns = customObj;
        } else if ( $(obj).attr("data-entity") == "chart" ) {

            columns = startObj["chart"][$(obj).attr("data-mode")][$(obj).attr("data-target")]["columns"];            
            var heads = startObj["chart"]["heads"];
            if ( startObj["chart"]["search"] ) {
                heads = Object.assign( {}, heads, startObj["chart"]["search"]);
            }
            
            $.each(columns, function(k, v){
                Object.assign(v, heads[k]);
            });

        } else if ($(obj).attr("data-entity") == "form") {
            columns = startObj["form"]["heads"];
        }

        var lines = $("<div>");

        $.each(columns, function(k, v) {
            
            var row = $("<div>").addClass("row");
            var value = null;

            if("data-org" in v) {
                $(row).attr("data-org", v["data-org"]);
                value = v["data-org"];
            }            
            if ( value == null ) {
                if ( "default" in v ) {
                    if ( v["default"] == null ) {
                        value = "";
                        $(row).attr("data-default-null", "");
                    } else {
                        value = v["default"];
                    }
                }
            }

            var label = renderFnc["formLineLabel"](v);
            var labelName = $(label).text()
            $(row).append(label);

            var edit = $("<div>").addClass("edit");

            if( v["type"] == "string" || v["type"] == "number" ) {

                if (v["input"] && v["input"] == "readonly" ) {
                    
                    var div = $("<div>").addClass("att-input att-input-view").attr("data-alias", labelName).attr("data-name", v["name"]).attr("data-value", value).html(value);
                    $(edit).append(div);

                } else if ( v["display"] && (v["display"] == "text" || v["display"] == "markdown")) {

                    var tmp = $("<textarea>").addClass("att-input att-input-textarea").attr("data-alias", labelName).attr("data-name", v["name"]).attr("data-value", value).val(value)
                    if (v["input"] && v["input"] == "required" ) $(tmp).addClass("required");
                    $(edit).append (tmp);

                    //$(label).addClass("fnc-edit-open-pop").attr("title","text").attr("data-mode","text").attr("data-target",v["name"]);
                
                } else if ( v["display"] && v["display"] == "date" ) {
                    var tmp = $("<input>").addClass("att-input att-input-date").attr("type", "date").attr("data-alias", labelName).attr("data-name", v["name"]).attr("data-value", value).val(value);
                    if (v["input"] && v["input"] == "required" ) $(tmp).addClass("required");
                    $(edit).append (tmp);

                } else if ( v["display"] && v["display"] == "json" ) {

                    var tmp = $("<textarea>").addClass("att-input att-input-textarea").attr("data-alias", labelName).attr("data-name", v["name"]).attr("data-value", value).val(value)
                    if (v["input"] && v["input"] == "required" ) $(tmp).addClass("required");
                    $(edit).append (tmp);

                } else if ( v["display"] && v["display"] == "password" ) {

                    var tmp = $("<input>").addClass("att-input att-input-text").attr("type", "password").attr("data-alias", labelName).attr("data-name", v["name"]);
                    if (v["input"] && v["input"] == "required" ) $(tmp).addClass("required");
                    $(edit).append (tmp);

                } else if ( v["display"] && v["display"] == "choice" ) {

                    var valStr = value+"";
                    var valArr = [valStr];

                    if ( valStr == "" ) {
                        for( var kk=0; kk<v["values"]["length"]; kk++ ) {
                            valArr[kk] = "" ;
                        }
                    }

                    var isExists = valArr.some(value => v["values"]["data_rev"].hasOwnProperty(value));
                    if (v["values"]["data_rev"] && v["values"]["data_rev"][valStr]) {
                        valArr = v["values"]["data_rev"][valStr];
                    } else {
                        if ( !isExists ) valArr = new Array(v["values"]["length"]);
                    }

                    var values = v["values"]["data"];

                    $.each(valArr, function(i, item) {

                        var select = $("<select>").addClass("att-input att-input-select")
                                        .attr("data-seq", i)
                                        .attr("data-alias", labelName)
                                        .attr("data-name", v["name"])
                                        .attr("data-value", item)
                                        .attr("data-step", "intermed")
                                        .append($("<option>").attr("value", "").html("none"));
    
                        var cursor = values;
                        for( j=0; j<i; j++ ){
                            if(cursor[valArr[j]]) cursor = cursor[valArr[j]];
                            else cursor = "";
                        }
                        $.each(cursor, function(kk,vv) {
                            var tmpObj = $("<option>").attr("value",vv).html(kk)
                            if (vv instanceof Object) {
                                tmpObj = $("<option>").attr("value",kk).html(kk)
                            }
                            $(select).append(tmpObj);
                        });

                        $(select).find('option[value="' + item + '"]').prop("selected", true);
                        $(select).find('option[value="' + value + '"]').prop("selected", true);
                            
                        if ( i == (valArr.length - 1) ) $(select).attr("data-value", valStr).removeAttr("data-step");

                        if (v["input"] && v["input"] == "required" ) $(select).addClass("required");


                        $(edit).append(select);
                    })

                } else if ( v["display"] && v["display"] == "multi" ) {

                    var valArrOrg = value.split(v["delimiter"]);
                    var valArr = {};
                    
                    if ( valArrOrg == "" ) valArr[0] = null ;
                    else {
                        $.each(valArrOrg, function(kk,vv) {
                            if ( vv in v["values"]["data_rev"] )
                                valArr[kk] = v["values"]["data_rev"][vv].join(" > ");
                            else {
                                valArr[kk] = [vv].join(" > ");
                            }
                        })
                    }

                    var div = $("<div>").addClass("att-input att-input-view").attr("data-alias", labelName).attr("data-name", v["name"]).attr("data-value", value);
                    if (v["input"] && v["input"] == "required" ) $(div).addClass("required");
                    $(edit).append(div);

                    $.each(valArr, function(i, item){
                        var valObj = $("<div>").html($("<span>").attr("data-value",valArrOrg[i]).html(item));
                        $(div).append(valObj);
                    });
                } else if ( v["display"] && v["display"] == "search" ) {
                    
                    var div = $("<div>").addClass("att-input att-input-view").attr("data-alias", labelName).attr("data-name", v["name"]).attr("data-value", value);
                    if (v["input"] && v["input"] == "required" ) $(div).addClass("required");
                    $(edit).append(div);

                    $.each(valArr, function(i, item){
                        var valObj = $("<div>").html($("<span>").attr("data-value",valArrOrg[i]).html(item));
                        $(div).append(valObj);
                    });

                } else if ( v["display"] && v["display"] == "blind" ) {
                    var tmp = $("<input>").addClass("att-input att-input-text").attr("type", "passowrd").attr("data-alias", labelName).attr("data-name", v["name"]).attr("data-value", value).val("");
                    if (v["input"] && v["input"] == "required" ) $(tmp).addClass("required");
                    $(edit).append (tmp);

                } else if ( v["display"] && v["display"] == "key" ) {
                    $(row).addClass("att-key").attr("data-name", v["name"]).attr("data-value", value);

                } else if ( v["display"] && (v["display"] == "files" || v["display"] == "files_server") ) {

                    var viewObj = $("<div>")
                                .addClass("att-input att-input-view")
                                .attr("data-alias", labelName)
                                .attr("data-name", v["name"])
                                .attr("data-value", value);
                    if (v["input"] && v["input"] == "required" ) $(viewObj).addClass("required");
                    $(edit).append(viewObj);
                    
                    if ( value != null && value != "" ) {
                        var valueArr = value.split(",");
                        for (var i=0; i<valueArr.length; i++) {
                            var item = valueArr[i];
                            var name = item.split("/").pop();
                            var nameObj = $("<span>").addClass("fnc-delete-item").attr("data-value", item).html(name);
                            $(viewObj).append($("<div>").append(nameObj));
                        }
                    }

                    var accept = "";
                    if (startObj["chart"]["uploads"][v["name"]]["accept"]) 
                        accept = startObj["chart"]["uploads"][v["name"]]["accept"];

                    var uploadInfo = {};
                        uploadInfo["post"] = "1";
                        uploadInfo["method"] = "form";
       
                    var fileUnit = $("<div>").addClass("att-upload-file");
                    var fileObj = $("<input>")
                        .addClass("att-input-file")
                        .attr("type", "file")
                        .attr("name", "files[]")
                        .attr("data-alias", "image file")
                        .attr("data-name", "file")
                        .attr("accept", accept)
                        .prop("multiple", true);;
                    var fileBtn = getLinkObj( panelObj, "btn", 
                        $(obj).attr("data-entity"), $(obj).attr("data-mode"), v["name"],
                        v["display"], "upload", "att-width-70", uploadInfo );
                    
                    $(fileUnit).append(fileObj).append(fileBtn)
                    $(edit).append(viewObj).append(fileUnit);

                } else if ( v["display"] && (v["display"] == "image" || v["display"] == "image_server") ) {

                    var input = $("<input>")
                        .addClass("att-input att-input-text")
                        .attr("type", "text")
                        .attr("data-alias", labelName)
                        .attr("data-name", v["name"])
                        .attr("data-value", value)
                        .val(value);
                    if (v["input"] && v["input"] == "required" ) $(tmp).addClass("required");
                    $(edit).append (input);

                    if ( startObj["chart"]["uploads"][v["name"]] ) {

                        var accept = ".jpg,.jpeg,.png,.gif,.webp";
                        if (startObj["chart"]["uploads"][v["name"]]["accept"]) 
                            accept = startObj["chart"]["uploads"][v["name"]]["accept"];

                        var uploadInfo = {};
                        uploadInfo["post"] = "1";
                        uploadInfo["method"] = "form";
                        
                        var fileUnit = $("<div>").addClass("att-upload-file");
                        var imgObj = $("<input>")
                            .addClass("att-input-file")
                            .attr("type", "file")
                            .attr("name", "files[]")
                            .attr("data-alias", "image file")
                            .attr("data-name", "file")
                            .attr("accept", accept);
                        var fileBtn = getLinkObj( panelObj, "btn", 
                            $(obj).attr("data-entity"), $(obj).attr("data-mode"), v["name"],
                            v["display"], "upload", "att-width-70", uploadInfo );
                        
                        $(fileUnit).append(imgObj).append(fileBtn)
                        $(edit).append(fileUnit);
                    }

                } else {


                    //columns = startObj["chart"][$(obj).attr("data-mode")][$(obj).attr("data-target")]["columns"];            
                    //var heads = startObj["chart"]["heads"];
          
                    var inputType = "text";
                    if (v["type"] == "number" ) inputType = "number";
                    
                    var step = 1;
                    if (v["point"]) {
                        for ( var scnt=0; scnt<v["point"]; scnt++ ) step *= 10;
                        step = 1/step;
                    }

                    if (!value && $(obj).attr("data-mode") == "insert" ) {
                        if ("default" in v) value = v["default"];
                    }

                    var tmp = $("<input>")
                        .addClass("att-input att-input-text")
                        .attr("type", inputType)
                        .attr("data-alias", labelName)
                        .attr("data-name", v["name"])
                        .attr("data-value", value)
                        .val(value);

                    if (v["input"] && v["input"] == "required" ) $(tmp).addClass("required");
                    if ( step !== 1 ) $(tmp).attr("step", step);
                    
                    $(edit).append (tmp);
                }

            } else if ( v["type"] == "excel" ) {

                var div1 = $("<div>").addClass("att-upload-file");
                var fileObj = $("<input>")
                    .addClass("att-input att-input-file required")
                    .attr("type", "file")
                    .attr("name", "file")
                    .attr("data-alias", "excel file")
                    .attr("data-name", "file")
                    .attr("accept", ".xlsx");

                $(div1).append(fileObj);
                $(edit).append(div1);
            }
            $(row).append(edit);
            $(lines).append(row);
        });

        return $(lines).find("div.row");
    },

    formLineLabel: function(v) {

        var alias = v["name"];
        if ( v["alias"]) alias = v["alias"];
        if (v["unit"]) alias += " (" + v["unit"] + ")";

        var label;
        if ( v["display"] && ( v["display"] == "text" || v["display"] == "markdown" || v["display"] == "json" || v["display"] == "multi" || v["display"] == "search" ) ) {
            label = getLinkObj($("#pop1"), "color-dodgerblue", "pop1", v["display"], v["name"], "", alias, "label" ); 

        } else {
            label = $("<span>").addClass("label").html(alias);
        }

        if (v["input"] && v["input"] == "required" ) $(label).addClass("require-mark");
        return label;
    },

    stringT: function(head, info, td, row, val) {
        val = getHtmlEntity(val);
        val = renderFnc["allTlink"](head, info, td, row, val);
        return val;
    },

    stringTmarkdown: function(head, info, td, row, val) {
        val = getHtmlEntity(val);
        val = toHtml(val);
        return val;
    },
    stringTdate: function(head, info, td, row, val) {
        val = renderFnc["allTlink"](head, info, td, row, val);
        return val;
    },
    stringTchoice: function(head, info, td, row, val) {
        if (info["values"]["data"] && !info["values"]["data_rev"]) 
            info["values"]["data_rev"] = switchKeyVal(info["values"]["data"]);
        
        if ( info["values"]["data_rev"][val+""] instanceof Object ) val = info["values"]["data_rev"][val+""].join(" > ");

        val = renderFnc["allTlink"](head, info, td, row, val);
        return val;
    },
    stringTmulti: function(head, info, td, row, val) {

        if (info["values"]["data"] && !info["values"]["data_rev"]) 
            info["values"]["data_rev"] = switchKeyVal(info["values"]["data"]);

        if (!info["delimiter"]) info["delimiter"] = ",";

        var valArr = val.split(info["delimiter"]);
        
        if (valArr) {
            $.each(valArr, function(i,item) {
                if ( info["values"]["data_rev"][item+""] ) {
                    valArr[i] = info["values"]["data_rev"][item+""].join(" > ");
                }
            });
        }

        var styleItemStr = "";
        if ("style_item" in info) {
            for (const [k, v] of Object.entries(info["style_item"])) {
                styleItemStr += `${k}:${v};`;
            }
            styleItemStr = `style='${styleItemStr}'`;
        }
        val = "<span "+styleItemStr+">" + valArr.join("</span><span "+styleItemStr+">") + "</span>";
        return val;
    },
    stringTimage: function(head, info, td, row, val) {

        if ( !val || val == "" ) return val;
        var imgSrc = val ;
        if (info["url_prefix"]) imgSrc = info["url_prefix"] + val;

        var imgObj = $("<img>").addClass("image").attr("src", imgSrc);
        var aObj = $("<a>").attr("href", imgSrc).attr("target", "_blank").html(imgObj);
        val = $(aObj).prop("outerHTML");
        
        val = renderFnc["allTlink"](head, info, td, row, val);
        return val;
    },
    stringTimage_server: function(head, info, td, row, val) {

        if ( !val || val == "" ) return val;
        val = _p["const"]["downloadImage"] + _p["group"] + "&.p=" + encodeURIComponent(val);

        var imgSrc = val ;
        if (info["url_prefix"]) imgSrc = info["url_prefix"] + val;

        var imgObj = $("<img>").addClass("image").attr("src", imgSrc);
        var aObj = $("<a>").attr("href", imgSrc).attr("target", "_blank").html(imgObj);
        val = $(aObj).prop("outerHTML");
        
        val = renderFnc["allTlink"](head, info, td, row, val);
        return val;
    },
    stringTtext: function(head, info, td, row, val) {
        val =  getHtmlEntity(val);
        $(td).find(".value").addClass("fnc-text-view");
        if (val) val = val.replace(/\n/g, "<br/>");
        return val;
    },
    stringTblind: function(head, info, td, row, val) {
        return val;
    },
    stringThide: function(head, info, td, row, val) {
        $(td).addClass("att-hidden");
        return val;
    },
    stringTjson: function(head, info, td, row, val) {
        val =  getHtmlEntity(val);
        $(td).find(".value").addClass("att-content");
        return val;
    },
    stringTflow: function(head, info, td, row, val) {

        if (info["values"]["data"] && !info["values"]["data_rev"]) 
        info["values"]["data_rev"] = switchKeyVal(info["values"]["data"]);
        
        var valStr = val+"";
        if ( info["values"]["data_rev"][valStr] instanceof Object ) val = info["values"]["data_rev"][valStr].join(" > ");

        if ( info["flow"]["step"][valStr] ) {
            var nextStepArr = info["flow"]["step"][valStr].split(",");
            $.each(nextStepArr, function(i,code) {

                code = $.trim(code);
                var name = info["values"]["data_rev"][code];
                var a = getLinkObj(null, "flow-next", "chart", "flow", info["name"], "", name, "", {
                    "value": code,
                    "post":1
                });
                val += $(a).prop("outerHTML");
            });
        }

        return val;
    },    
    stringTkey: function(head, info, td, row, val) {
        $(td).addClass("att-key");
        return val;
    },

    stringTfiles: function(head, info, td, row, val) {
        if (val == null || val == "") return "";

        var valArr = val.split(",");
        var final_val = "";
        for ( var i=0; i<valArr.length; i++) {
            
            var item = valArr[i];
            var name = item.split("/").pop();
            var a = $("<a>").addClass("att-link-file att-div")
                .attr("href", item)
                .attr("target", "_blank")
                .html(name);

            final_val += $(a).prop("outerHTML");

        }

        return final_val;
    },
    stringTfiles_server: function(head, info, td, row, val) {
        if (val == null || val == "") return "";

        var valArr = val.split(",");
        var final_val = "";
        for ( var i=0; i<valArr.length; i++) {
            
            var item = valArr[i];
            var name = item.split("/").pop();
            var a = $("<a>").addClass("att-link-file att-div")
                .attr("href", _p["const"]["downloadFile"] + _p["group"] + "&.p=" +  encodeURIComponent(item) )
                .attr("target", "_win")
                .html(name);

            final_val += $(a).prop("outerHTML");
        }

        return final_val;
    },
    
    numberT: function(head, info, td, row, val) {

        if (info["type"] && info["type"] == "number") {
            $(td).find(".value").addClass("att-align-right");
            if ( "point" in info ) {
                val= numberFormat(val, info["point"]);
            } else {
                if (val !== null) val = numberFormat(val);
            }
        }

        val = renderFnc["allTlink"](head, info, td, row, val);

        return val;
    },
    numberTchoice: function(head, info, td, row, val) {
        return renderFnc["stringTchoice"](head, info, td, row, val);
    },
    numberTkey: function(head, info, td, row, val) {
        return renderFnc["stringTkey"](head, info, td, row, val);
    },
    numberThide: function(head, info, td, row, val) {
        $(td).addClass("att-hidden");
        return val;
    },

    numberTtext: function(head, info, td, row, val) {
        return renderFnc["stringTtext"](head, info, td, row, ""+val);
    },

    opsTarrange: function(head, info, td, row, val) {
        val = "<span class='att-move'></span>"
        $(td).addClass("att-hidden");
        $(td).find(".value").addClass("att-align-center");
        return val;
    },


    allTlink: function(head, info, td, row, val) {

        if (info["link"] && info["link"]["type"]) {

            if (info["link"]["type"] == "panel") {
                var link = JSON.stringify(info["link"]["rule"]);
                var linkObj = $("<a>").addClass("fnc-link-id").attr("href", "#").attr("data-link",link).html(val);
                val = $(linkObj).prop("outerHTML");

            } else if (info["link"]["type"] == "url") {

                var idx = head.indexOf(info["link"]["column"]);
                if ( idx == -1 ) {
                    idx = head.indexOf(info["name"]);
                }
                
                var linkObj = $("<a>").addClass("outlink").attr("href", row[idx]).attr("target","_blank").html(val);
                val = $(linkObj).prop("outerHTML");
                
            } else if (info["link"]["type"] == "view") {
                if ( !info["link"]["rule"] || !info["link"]["rule"]["key"] || !info["link"]["rule"]["id"] ) return val;

                var linkObj = $("<a>").addClass("fnc-link viewlink")
                    .attr("href", "#")
                    .attr("data-entity","chart")
                    .attr("data-mode","view")
                    .attr("data-view-key", JSON.stringify(info["link"]["rule"]["key"]))
                    .attr("data-view-id", info["link"]["rule"]["id"])
                    .html(val);

                val = $(linkObj).prop("outerHTML");
            } 
        }

        return val;
    },

    renderChart: function(panelObj, chartInfo, chartClass) {

        var chartId = "chart" + chartInfo["id"];
        var chartClass = chartInfo["class"];
        var chartObj = $(panelObj).find("." + chartClass);

        $(chartObj).html("");

        if ( chartInfo["title"] ) {

            var chartHead = $("<div>").addClass(chartClass + "-head");
            var chartTitle = $("<div>").addClass(chartClass + "-head-title").html("Dynamic Chart : " + chartInfo["title"]);
            var chartClose = $('<a href="#" class="att-icon att-icon-close fnc-close-btn" title="dynamic-chart-close"></a>');
            
            $(chartHead).append(chartTitle).append(chartClose);
            $(chartObj).append(chartHead)
                
        }

        var chartLegend = $("<div>").addClass( chartClass + "-legend" );
        var chartLegendBtns = $("<div>").addClass("btns").attr("id", "lgdbtn" + chartId).attr("data-chart", chartId);
        var chartLegendItems = $("<div>").addClass("items").attr("id", "lgditem" + chartId).attr("data-chart", chartId);
        $(chartLegend).append(chartLegendBtns).append(chartLegendItems);

        var chartCanvas = $("<div>").addClass(chartClass + "chart-canvas").height(300);
        var chartCanvasCore = $("<canvas>").attr("id", chartId);
        $(chartCanvas).append(chartCanvasCore);    
        $(chartObj).append(chartLegend).append(chartCanvas);

        if (chartInfo["height"]) $(chartCanvas).height(chartInfo["height"]);

        // 1st column data of values
        var xLabel = chartInfo["values"].map(row => row[0]);
        // 1st column removed data of head
        var dataLabel = chartInfo["heads_orders"].slice(1);
        // values of removed 1st column
        var tmpArr = chartInfo["values"].map(row => row.slice(1));
        // transform
        var dataArr = []
        if ( tmpArr.length > 0 ) dataArr = tmpArr[0].map((_, colIndex) => tmpArr.map(row => row[colIndex]));

        var chart_stack = {"x":false, "left":false, "right":false};
        if (chartInfo["stack"] ) {
            for ( var j=0; j < chartInfo["stack"].length; j++ ) {
                chart_stack[ chartInfo["stack"][j] ] = true;
            }
        }

        var dataSet = [];
        for ( var i=0; i<dataArr.length; i++ ) {

            var chart_type = ( chartInfo["heads"][dataLabel[i]]["chart"] && chartInfo["heads"][dataLabel[i]]["chart"]["type"] 
                                ? chartInfo["heads"][dataLabel[i]]["chart"]["type"] : "bar" );
                                
            if ( chartInfo["pivot"] && chartInfo["pivot"]["chart"] && chartInfo["pivot"]["chart"]["type"] ) {

                if ( chartInfo["pivot"]["chart"]["type"] != "" ) {
                    chart_type = chartInfo["pivot"]["chart"]["type"] ;
                }
            }

            var chart_y = ( chartInfo["heads"][dataLabel[i]]["chart"] && chartInfo["heads"][dataLabel[i]]["chart"]["y"] 
                                ? chartInfo["heads"][dataLabel[i]]["chart"]["y"] : "y" );

            var tmpObj = {};
            tmpObj["label"] = chartInfo["heads"][dataLabel[i]]["alias"] ? chartInfo["heads"][dataLabel[i]]["alias"] : dataLabel[i];
            if ( chartInfo["heads"][dataLabel[i]]["unit"] ) tmpObj["label"] +=  " (" + chartInfo["heads"][dataLabel[i]]["unit"] + ")";

            tmpObj["data"] = dataArr[i];
            tmpObj["type"] = chart_type ;
            tmpObj["yAxisID"] = chart_y ;

            tmpObj["borderWidth"] = 1;
            tmpObj["pointRadius"] = 2;
            if ( dataArr.length > 0 && dataArr[0].length > 50 ) tmpObj["pointRadius"] = 0;

            tmpObj["cubicInterpolationMode"] = "monotone";
            tmpObj["tension"] = 0.1;
            
            dataSet.push(tmpObj);
        }
        var data = {}
        data["labels"] = xLabel;
        data["datasets"] = dataSet;

        var isEmptyLeft = data.datasets.find(dataset => dataset.yAxisID === 'y' && dataset.data.length > 0) === undefined;
        var isEmptyRight = data.datasets.find(dataset => dataset.yAxisID === 'right' && dataset.data.length > 0) === undefined;
        var customTooltip;

        var config = {
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {mode: "index"},
                plugins: {
                    legend: { display: false, onClick: null },
                    tooltip: {
                        enabled: false,
                        position: 'nearest',
                        external: customTooltip
                        /*
                        position: 'nearest',
                        boxPadding: 5,
                        caretPadding: 0,
                        usePointStyle: true, 
                        callbacks: {
                            labelPointStyle: function(context) {
                                return { pointStyle: "circle" };
                            }
                        }
                        */
                    },
                },
                scales: {
                    x: { stacked: chart_stack["x"] },
                    y: { stacked: chart_stack["left"], display:!isEmptyLeft,
                        ticks: {
                            callback: formatYAxisTicks
                        }
                    },
                    right :{
                        display: !isEmptyRight,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        stacked: chart_stack["right"],
                        ticks: {
                            callback: formatYAxisTicks
                        }
                    }
                }
            }
        };

        var canvas = document.getElementById(chartId);
        var ctx = canvas.getContext("2d");
        _p["chartObj"][chartId] = new Chart(ctx, config);



        function getAxisNum(val) {
            if (val%1 == 0) return val;
            else {
                var a = val.toString();
                var b = a.split(".")[1].length;
                if(b>=4) return parseFloat(val.toFixed(4)) ;
                else return val;
            }
        }
        function formatYAxisTicks(value) {
            var vv = Math.abs (value) ;
            if ( vv >= 1000 && vv < 1000000) return getAxisNum(value / 1000) + ' K';
            else if ( vv >= 1000000 && vv < 1000000000) return getAxisNum(value / 1000000) + ' M';
            else if ( vv >= 1000000000 ) return getAxisNum(value / 1000000000) + ' B';
            else return getAxisNum(value);
        }


        function customTooltip(context) {
            var {chart, tooltip} = context;
            var tooltipObj = $("#tooltip");

            // Hide if no tooltip
            if (tooltip.opacity === 0) {
                $(tooltipObj).hide();
                return;
            }

            if ( tooltip.body ) {
                
                var title = tooltip.title;

                $(tooltipObj).find(".title").html(title);
                $(tooltipObj).find(".lists").html("");

                for (var i=0; i<tooltip.body.length; i++ ) {

                    var text = tooltip.body[i].lines[0];
                    var bgColor = tooltip.labelColors[i].backgroundColor;
                    var lineColor = tooltip.labelColors[i].borderColor;

                    var color = $("<span>").addClass("color")
                                .css("background-color", bgColor)
                                .css("border", "1px solid " + lineColor)
                                ;
                    var context = $("<span>").addClass("context").html(text);

                    $(tooltipObj).find(".lists").append($("<li>").append(color).append(context));
                }
            }

            const {left: positionX, top: positionY} = $("#" + chartId).offset();

            var pointGap = 10;
            var pointRev = 15;
            var pointTop = 40;
            
            var tooltipX = positionX + tooltip.caretX + pointGap;
            if ( tooltip.caretX > (_p["chartObj"][chartId].width/2) ) tooltipX = tooltipX - tooltip.width - pointRev - pointGap ;

            var tooltipY  = positionY + (_p["chartObj"][chartId].height/2) - (tooltip.height/2) - pointTop ;
            if ( tooltipY < pointTop ) tooltipY = pointTop;
            if ( ($(window).height() - pointTop ) < (tooltip.height + tooltipY) ) {

                tooltipY = pointTop;
            
            }

            $(tooltipObj).css("left", tooltipX);
            $(tooltipObj).css("top", tooltipY);
            $(tooltipObj).show();
            
          };


        function createCustomLegend(chart) {

            var legendBtns = document.getElementById("lgdbtn" + chartId);
            var legendItems = document.getElementById("lgditem" + chartId);
            var datasets = chart.data.datasets;

            var btnStr = ["show all", "hide all"];
            for (var i=0; i<btnStr.length ; i++ ) {
                var btnItem = document.createElement("a");
                btnItem.classList.add("btn");
                btnItem.setAttribute("href", "#");
                btnItem.appendChild(document.createTextNode(btnStr[i]))
                legendBtns.appendChild(btnItem);

                btnItem.addEventListener('click', function(event) {
                    event.preventDefault();
                    var mode = event.target.textContent;
                    if ( mode == "show all") {
                        datasets.forEach((dataset, datasetIndex) => {
                            var meta = chart.getDatasetMeta(datasetIndex);
                            meta.hidden = null;
                        });

                        var legendLinks = document.querySelectorAll('#lgditem' + chartId + ' .item');
                        legendLinks.forEach(function(link) {
                            link.classList.remove('hidden');
                        });

                    } else if ( mode == "hide all") {
                        datasets.forEach((dataset, datasetIndex) => {
                            var meta = chart.getDatasetMeta(datasetIndex);
                            meta.hidden = true;
                        });

                        var legendLinks = document.querySelectorAll('#lgditem' + chartId + ' .item');
                        legendLinks.forEach(function(link) {
                            link.classList.add('hidden');
                        });
                    }
                    chart.update(); 
                });
            }

            datasets.forEach((dataset, datasetIndex) => {

                var legendItem = document.createElement("a");
                legendItem.classList.add("item");
                legendItem.setAttribute("href", "#");
                if ( dataset.yAxisID == "right" ) legendItem.classList.add("right");

                var color = document.createElement("span");
                color.classList.add("color");
                color.style.backgroundColor = dataset.backgroundColor;
                color.style.borderColor = dataset.borderColor;

                var text = document.createTextNode(dataset.label);

                legendItem.appendChild(color);
                legendItem.appendChild(text);
                legendItems.appendChild(legendItem);

                // click event listener
                legendItem.addEventListener('click', function(event) {
                    event.preventDefault();
                    var meta = chart.getDatasetMeta(datasetIndex);
                    meta.hidden = meta.hidden === null ? !chart.data.datasets[datasetIndex].hidden : null;
                    chart.update();
                    legendItem.classList.toggle('hidden');
                });
            });
        }
        createCustomLegend(_p["chartObj"][chartId]);        
    }
};
