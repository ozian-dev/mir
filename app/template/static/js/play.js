
function closePop1(obj) {

    var targetObj = $("#pop1 .space .form .formbox .tail .fnc-link[data-target='"+obj["target"]+"']");
    var panelObj = $("#pan" + obj["pid"]);

    if ( obj["run"] && obj["run"] == "test" ) {
        modal("test ok");
        return;
    }

    if (obj["entity"] == "form") {
        if ( obj["forward"] ) {
            $("#pan" + obj["forward"]).find(".head .tools a[data-type=reload]").click();
        } else if ( obj["html"] ) {
            $(panelObj).find(".form .result").html(obj["html"]);
            highlightEffectRow($(panelObj).find(".form .result"));
        } 
    } else if (obj["mode"] == "insert") {
        $(panelObj).find(".head .tools  a[data-type=reload]").click();
    } else {
        if (_p["p"]["i"][obj["pid"]]["chart"]["list"] && _p["p"]["i"][obj["pid"]]["chart"]["list"]["type"] == "scroll" ) {
            $(panelObj).find(".head .tools  a[data-type=reload]").click();
        } else if ($(targetObj).attr("data-force") === "1" ) {
            $(panelObj).find(".head .tools  a[data-type=reload]").click();
        } else {
            renderDataUpdate (panelObj, obj);
        }
    }

    $("#pop1 .head .fnc-close-btn").click();
    modal("ok");
}


var playFnc = {
    
    formTexecute: function(obj){
        renderPop1($(obj), "form");
    },

    chartToperate: function(obj){

        var panelObj = getPanelObj($(obj));
        tableToolFnc["toolClick"](panelObj, obj);
        var type = $(obj).attr("data-type");

        initFnc["chartToperate"](panelObj, obj);

        var actInfo = _p["p"]["i"][$(panelObj).attr("data-i")]["chart"]["operate"][$(obj).attr("data-target")]["act"];
        var act = $("<div>").addClass("act");
        $.each(actInfo, function(i, actItem) {
            if (actItem["columns"]) {
                var inputs = $("<span>");
                for (var i=0; i<actItem["columns"].length; i++) {
                    
                    var col = actItem["columns"][i];
                    var colInfo = _p["p"]["i"][$(panelObj).attr("data-i")]["chart"]["heads"][col["name"]];
                    var alias = colInfo["name"];
                    if ( colInfo["alias"] ) alias = colInfo["alias"];
                    if ( colInfo["unit"] ) alias += " (" + colInfo["unit"] + ")";
                    var input = $("<input>")
                        .addClass("att-input att-input-text")
                        .attr("type", "text")
                        .attr("data-target", $(obj).attr("data-target"))
                        .attr("data-target-sub", actItem["name"])
                        .attr("data-type", $(obj).attr("data-type"))
                        .attr("data-name", col["name"])
                        .attr("placeholder", alias);
                    if (col["input"] && col["input"] == "required" ) $(input).addClass("required");
                    $(inputs).append(input);
                }
                $(act).append(inputs);
            }

            var alias = actItem["alias"] ? actItem["alias"] : actItem["name"];
            var btn = getLinkObj(panelObj, "btn", "chart", "operate", $(obj).attr("data-target"), $(obj).attr("data-type"), alias, "", {"target-sub":actItem["name"], "post":"1"});
            $(act).append(btn);
        })

        if (!actInfo && $(obj).hasClass("att-selected-item")) {
            var btn = getLinkObj(panelObj, "btn", "chart", "operate", $(obj).attr("data-target"), $(obj).attr("data-type"), "save", "", {"post":"1"});
            $(act).append(btn);
        }

        $(panelObj).find(".search").append(act);

        playFnc["chartToperate" + "T" + $(obj).attr("data-type")](obj);
        
    },

    chartToperateTtable: function(obj){

        var pid = $(obj).attr("data-i");
        var panelObj = $("#pan" + pid);

        if ($(obj).hasClass("att-selected-item")) {

            var colArr = _p["p"]["i"][pid]["chart"]["operate"][$(obj).attr("data-target")]["columns_orders"];

            $(panelObj).find(".chart .chart-table .table tr.row").each(function(i, row){
                
                for ( var j=0; j<colArr.length; j++) {

                    var tarCol = $(row).find("td[data-name='"+colArr[j]+"']");
                    var info = _p["p"]["i"][pid]["chart"]["heads"][colArr[j]]
                    var edit =$("<div>").addClass("edit").html($(tarCol).attr("data-org"));
                    $(tarCol).append(edit);

                    if ( info["display"] && info["display"] == "text" ) {
                        inObj = $("<textarea>").addClass("att-input att-input-textarea")
                                                .attr("data-name", info["name"])
                                                .attr("data-value", $(tarCol).attr("data-org"))
                                                .val($(tarCol).attr("data-org"));
                    
                    } else if ( info["display"] && info["display"] == "choice" ) {
                        // render select
                        inObj = $("<select>").addClass("att-input att-input-select")
                                                .attr("data-name", info["name"])
                                                .attr("data-value", $(tarCol).attr("data-org"))
                                                .append($("<option>").attr("value", "").html("none"));

                        $.each(info["values"]["data"], function(kk,vv) {
                            var tmpObj = $("<option>").attr("value",vv).html(kk);
                            $(inObj).append(tmpObj);
                        });
                        $(inObj).find('option[value="' + $(tarCol).attr("data-org") + '"]').prop("selected", true);

                    } else if ( info["display"] && info["display"] == "multi" ) {
                        // don't support, need to alert
                        
                    } else if ( info["display"] && info["display"] == "date" ) {
                        var inputType = "date";
                        inObj = $("<input>").addClass("att-input att-input-date")
                                            .attr("type", inputType)
                                            .attr("data-name", info["name"])
                                            .attr("data-value", $(tarCol).attr("data-org"))
                                            .val($(tarCol).attr("data-org"));
                        
                    } else {
                        var inputType = "text";
                        if (info["type"] == "number" ) inputType = "number";

                        inObj = $("<input>").addClass("att-input att-input-text")
                                            .attr("type", inputType)
                                            .attr("data-name", info["name"])
                                            .attr("data-value", $(tarCol).attr("data-org"))
                                            .val($(tarCol).attr("data-org"));

                    }
                    
                    $(edit).html(inObj);
                }
            })
        }
    },
    chartToperateTarrange: function(obj){

        var panelObj = getPanelObj(obj);

        if (!$(obj).hasClass("att-selected-item")) {

            $(panelObj).find(".chart .chart-table .table tr .att-def-extra").remove();
            $(panelObj).find(".chart .chart-table .table tr .att-td-shrink").removeClass("att-td-shrink");
            $(panelObj).find(".chart .chart-table .table tr td .tmp-content").addClass("att-content");

        } else {

            $(panelObj).find(".chart .chart-table .table tr").each (function(i, item) {
                if (i==0) {
                    var th = $("<th>").addClass("att-def-extra att-width-20 att-align-center")
                        .attr("data-key", $(obj).attr("data-target"))
                        .html("#");    
                    $(item).prepend(th);
                } else if ( !$(this).hasClass("row") ) {
                    var td = $("<td>").addClass("att-def-extra att-disable");    
                    $(item).prepend(td);
                } else {
                    var td = $("<td>").addClass("att-def-extra att-align-center");    
                    var move = $("<span>").addClass("att-move");
                    $(td).append(move);
                    $(item).prepend(td);

                    $(item).find("td .att-content").addClass("tmp-content").removeClass("att-content");
                    $(item).find("td").addClass("att-td-shrink");
                }
            });

            $(function() {
                $(panelObj).find(".table").sortable({
                    items: 'tr.row',
                    helper: 'clone',
                    axis: 'y',
                    containment: 'parent',
                    cursor: 'move',
                    opacity: 0.6,
                    handle: ".att-move",
                    update: function(event, ui) {}
                }).disableSelection();
            });
        }
    },
    chartToperateTselect: function(obj){

        var panelObj = getPanelObj(obj);

        if (!$(obj).hasClass("att-selected-item")) {

            $(panelObj).find(".chart .chart-table .table tr .att-def-extra").remove();
            $(panelObj).find(".search .act").remove();

        } else {

            $(panelObj).find(".chart .chart-table .table tr").each (function(i, item) {
                if (i==0) {
                    var th = $("<th>").addClass("att-def-extra att-width-20 att-align-center")
                        .attr("data-key", $(obj).attr("data-target"));
                    var select = $("<a>").addClass("fnc-select-all").attr("href", "#").html("all");
                    $(th).html(select);
                    $(item).prepend(th);
                } else if ( !$(this).hasClass("row") ) {
                    var td = $("<td>").addClass("att-def-extra att-disable");    
                    $(item).prepend(td);
                } else {
                    var td = $("<td>").addClass("att-def-extra att-align-center fnc-selects-td");    
                    var select = $("<a>").addClass("fnc-select-toggle").attr("href", "#");
                    $(td).append(select);
                    $(item).prepend(td);
                }
            });
        }

    },

    chartTexecute: function(obj){

        var panelObj = getPanelObj(obj);
        tableToolFnc["toolClick"](panelObj, obj);

        var pid = $(panelObj).attr("data-i");
        var execObj = _p["p"]["i"][pid]["chart"]["execute"][$(obj).attr("data-target")];
        var rowObj = $(panelObj).find(".chart .chart-table .table tr.att-selected-row");

        $.each(execObj["columns_orders"], function(i, name){
            execObj["columns"][name]["data-org"] = $(rowObj).find("td[data-name='"+name+"']").attr("data-org");
        });

        $(rowObj).find(".att-key").each( function(i, item) {
            execObj["columns"][$(item).attr("data-name")] = {};
            execObj["columns"][$(item).attr("data-name")]["data-org"] = $(item).attr("data-org");
        });

        renderPop1(obj, "execute");
    },

    chartTinsert: function(obj){

        if ( $(obj).attr("data-type") == "tool" ) {
            renderPop5(obj, "tool");

        } else {
            renderPop1(obj, "insert");
        }
    },

    chartTaction: function(obj){

        var panelObj = getPanelObj(obj);
        $(panelObj).find(".chart .chart-table .table tr .att-tr-click-highlight").removeClass("att-tr-click-highlight");
        $(obj).parent().parent().click();
        $(panelObj).find(".head .tools a[data-mode=execute][data-target='"+$(obj).attr("data-target")+"']").click();
    }, 

    chartTheads: function(obj){
        playFnc["chartTheads" + "T" + $(obj).attr("data-type")](obj);

    },

    chartTheadsTinfo: function(obj){
        renderPop1(obj);

    },

    chartTheadsTreload: function(obj){
        var panelObj = getPanelObj($(obj));
        $(panelObj).find(".progress").show();
        
        var cstObj = $(panelObj).find(".search .custom .item .value [data-name]");

        var queryStr = "";
        $(cstObj).each(function(i, item) {

            var keyName = $(item).attr("data-name");
            if (keyName=="@date") keyName = ".date";
            if ($(item).attr("data-value")) {
                queryStr += "&" 
                        + encodeURIComponent(keyName)
                        + "=" 
                        + encodeURIComponent($(item).attr("data-value"))
            }
        })

        if ( queryStr != "" ) queryStr = queryStr.substring(1);
        setHashParam($(panelObj).attr("data-seq"), queryStr);
        callPanel($(panelObj));
    },

    chartTheadsTexcel: function(obj){
        var panelObj = getPanelObj($(obj));
        var url = getPanelUrl(panelObj, {".t":"excel"});

        location.href = url;
    },

    chartTheadsTcsv: function(obj){
        var panelObj = getPanelObj($(obj));
        var url = getPanelUrl(panelObj, {".t":"csv"});

        location.href = url;
    },

    chartTtable: function(obj){


        var type = $(obj).attr("data-type");
        var panelObj = getPanelObj(obj);
        var cinfo = _p["p"]["i"][$(panelObj).attr("data-i")]["chart"];
    
        if ( type == "chart") {

            if ( $(panelObj).find(".search .dynamic-chart").length > 0 )
                $(panelObj).find(".search .dynamic-chart .dynamic-chart-head .fnc-close-btn").click() ;

            $(panelObj).find(".search .dyamic-chart").remove();
            $(panelObj).find(".search .custom .draw-chart").remove();

            var drawChart = $(_htmls["draw-chart"]);
            var definedChart = $(drawChart).find(".dac-defined select[data-name=defined]");
            var x = $(drawChart).find(".dac-custom .dac-axis div[data-name=x]");
            var y = $(drawChart).find(".dac-custom .dac-axis div[data-name=y]");

            if ( cinfo["dchart"] ) {
                for (var i=0; i<cinfo["dchart"].length; i++) {
                    var option = $("<option>").val(cinfo["dchart"][i]["name"]);
                    $(option).html(cinfo["dchart"][i]["name"]);
                    $(definedChart).append(option);
                }
            }

            for (var i=0; i<cinfo["heads_orders"].length; i++) {

                var head = cinfo["heads"][cinfo["heads_orders"][i]];

                if (head["type"] == "number") {
                    if ( !head["display"] || ( head["display"] != "key" && head["display"] != "hide" )) {
                        var item = $("<a>")
                            .addClass("fnc-select-toggle")
                            .addClass("fnc-put-array")
                            .attr("href", "#")
                            .attr("data-value", head["name"])
                            .html(head["alias"] ? head["alias"] : head["name"]);
                        $(y).append(item);
                    }
                }
                if ( !head["display"] || ( head["display"] != "key" && head["display"] != "hide" )) {
                    var item = $("<a>")
                        .addClass("fnc-select-one")
                        .attr("href", "#")
                        .attr("data-value", head["name"])
                        .html(head["alias"] ? head["alias"] : head["name"]);
                    $(x).append(item); 
                }
            }

            $(panelObj).find(".search .custom").append(drawChart);
            $(drawChart).slideDown();
        
        } else if ( type == "draw" ) {

            $(panelObj).find(".search .dyamic-chart").remove();

            var definedChart = $(panelObj).find(".search .custom .draw-chart .dac-defined select[data-name=defined]").attr("data-value");
            var chartType = $(panelObj).find(".search .custom .draw-chart .dac-defined select[data-name=type]").attr("data-value");
            var xSort = $(panelObj).find(".search .custom .draw-chart .dac-defined .dac-box .att-selected-item").attr("data-value");
            
            var data = {};

            if (definedChart) {                
                data = JSON.parse(JSON.stringify(getValFromArr(cinfo["dchart"], definedChart)));
                data["type"] = chartType;
            
            } else {

                var customObj = $(panelObj).find(".search .custom .draw-chart .dac-body .dac-custom .dac-axis");
            
                data["x"] = $(customObj).find(".fnc-selects[data-name=x] .att-selected-item").attr("data-value");
                data["x_prt"] = $(customObj).find(".fnc-selects[data-name=x] .att-selected-item").text();

                data["type"] = chartType;
                
                var tmpArr = $(customObj).find(".fnc-selects[data-name=y] .att-selected-item");
                data["y"] = [];
                data["y_prt"] = "";
                $(tmpArr).each (function( i, item){
                    data["y"].push($(item).attr("data-value"));
                    data["y_prt"] += $(item).attr("data-value") + ", ";
                })
                data["name"] = data["x_prt"] + " vs " + data["y_prt"];
                data["name"] = data["name"].substring(0, data["name"].length - 2);
            }

            if ( !data["x"] || data["x"].length < 1 ) {
                modal(_m[_l]["dynamicchartempty"], false);
                return;
            }    

            var dc = $("<div>").addClass("dynamic-chart");
            $(panelObj).find(".search").append(dc);

            var heads_orders = data["y"];
            heads_orders.unshift(data["x"]);
            var heads = {}
            var values = []
            for (var i=0; i<heads_orders.length; i++) {

                var name = heads_orders[i];
                heads[name] = cinfo["heads"][name];
                heads[name]["chart"] = {};
                heads[name]["chart"]["type"] = data["type"];

                var idx = cinfo["heads_orders"].indexOf(name)
                var tmpRow = [];
                var tr = $(panelObj).find(".chart .chart-table .table tr.row");
                $(tr).each (function(j, row) {
                    var val = $(row).find("td").eq(idx).attr("data-org");
                    tmpRow.push(val);
                });
                values.push(tmpRow);
            }
            values = transpose(values);

            if (xSort == "1") {

                values.sort((a, b) => {
                    const aValue = parseFloat(a[0]);
                    const bValue = parseFloat(b[0]);
                    if (!isNaN(aValue) && !isNaN(bValue)) return aValue - bValue;
                    return a[0].localeCompare(b[0]);
                });
            }

            var chartInfo = {
                "title" : data["name"],
                "id" : getUniqueId(),
                "class" : "dynamic-chart",
                "heads_orders" : heads_orders,
                "heads" : heads,
                "values" : values
            };
            renderFnc["renderChart"](panelObj, chartInfo);

            $(panelObj).find(".search .custom .draw-chart .dac-head a.fnc-close-btn").click();
        }

    },

    chartTview: function(obj){

        if ( $("#pop6").is(':visible') )  $("#pop6").hide();
        if ( !$(obj).parent().parent().hasClass("att-tr-click-highlight") ) $(obj).parent().click();
        
        renderPop6 (obj);
    },


    pop1Ttext: function(obj){
        renderPop2(obj);

    },
    pop1Tmulti: function(obj){
        renderPop2(obj);

    },
    pop1Tjson: function(obj){
        renderPop2(obj);

    },
    pop1Tsearch: function(obj){
        renderPop2(obj);

    },


    pop2Talign: function(obj){
        try {
            var jsonStr = editorJson.getValue();
            var format = JSON.stringify(JSON.parse(jsonStr), null, 4);
        } catch (e) { modal("invalid json:<br/>" + e, false); return; }
        editorJson.setValue(format+"\n\n\n");
        var firstLine = editorJson.getSession().getDocument().getLine(0);
        editorJson.gotoLine(1, 0, true);

        modal(_m[_l]["align"]);
    },  
    pop2Tcopy: function(obj){
        var jsonStr = editorJson.getValue();
        jsonStr = JSON.stringify(JSON.parse(jsonStr), null, 4);

        var textarea = $("<textarea>").val(jsonStr);
        $("body").append(textarea);
        $(textarea).select();
        document.execCommand('copy');
        $(textarea).remove();

        modal(_m[_l]["copy"]);

    },  
    pop2Tapply: function(obj){

        var dataMode = $("#pop2").attr("data-mode");
        var target =  $("#pop2").attr("data-target");

        if ( dataMode == "text") {

            var textStr = $("#pop2 .space .att-input-textarea").val();
            $("#pop1 .space .form .formbox .body .row .edit textarea[data-name='"+target+"']").val(textStr);
            $("#pop1 .space .form .formbox .body .row .edit textarea[data-name='"+target+"']").attr("data-value", textStr);

        } else if ( dataMode == "json") {

            var jsonStr = editorJson.getValue();
            jsonStr = JSON.stringify(JSON.parse(jsonStr)).trim();

            $("#pop1 .space .form .formbox .body .row .edit textarea[data-name='"+target+"']").val(jsonStr);
            $("#pop1 .space .form .formbox .body .row .edit textarea[data-name='"+target+"']").attr("data-value", jsonStr);

        } else if ( dataMode == "multi" || dataMode == "search" ) {

            var div;
            var vals = [];
            var delimiter = $("#pop2").attr("data-delimiter") ? $("#pop2").attr("data-delimiter") : ",";

            if ( $("#pop2").attr("data-tab") == "1" ) {

                var selObj = $("#pop2 .space .select").find(".att-selected-item");
                var tmpObj = $("<div>");
                
                $(selObj).each(function(i, item){
                    vals.push($(item).attr("data-value"));
                    $(tmpObj).append($("<div>").append($("<span>").attr("data-value", $(item).attr("data-value")).html($(item).text())));
                });
                
                div =  $(tmpObj).find("div");

            } else {


                div = $("#pop2 .space .result > div");
                $(div).find("span").removeClass();
                
                $(div).find("span").each( function(i,item) {
                    vals.push($(item).attr("data-value"));
                });
            }
                            
            $("#pop1 .space .form .formbox .body .row .edit .att-input-view[data-name='"+target+"']").html(div);
            $("#pop1 .space .form .formbox .body .row .edit .att-input-view[data-name='"+target+"']").attr("data-value",vals.join(delimiter));
        }

        $(obj).parent().find(".fnc-close-btn").click();

        highlightEffectRow($("#pop1 .space .form .formbox .body .row .fnc-link[data-target='"+target+"']").parent());
    },  
    pop2Tselect: function(obj) {
        if ( $(obj).parent().attr("data-depth") == "1" ) {
            $(obj).parent().next().find(".fnc-select-toggle:visible").addClass("att-selected-item");
        } else {
            $("#pop2 .space .select .tab:last .fnc-select-multi-add").click();
        }
    },
    pop2Tdelete: function(obj) {
        if ( $(obj).parent().attr("data-depth") == "1" ) {
            $(obj).parent().next().find(".fnc-select-toggle:visible").removeClass("att-selected-item")
        } else {
            $("#pop2 .space .result").html("");
        }
    },
    pop2Tselected: function(obj) {
        
        if ( $(obj).hasClass("att-selected-btn") ) {
            $(obj).parent().next().find(".fnc-select-toggle").show();
            $(obj).removeClass("att-selected-btn");

        } else {
            $(obj).parent().next().find(".fnc-select-toggle").hide();
            $(obj).parent().next().find(".att-selected-item").show();
            $(obj).addClass("att-selected-btn");
        }
    },
    pop2Treset: function(obj) {

        var panelId = $("#pop1").attr("data-i");
        var colName = $("#pop2").attr("data-target");

        var info = _p["p"]["i"][panelId]["chart"]["heads"][colName]
        var vals = $("#pop1 .space .form .formbox .row .edit").find("[data-name='" +colName + "']").attr("data-value").split(info["delimiter"])

        if ( $(obj).parent().attr("data-depth") == "1" ) {
            var select = $("#pop2 .space .select").html("");
            $.each(info["values"]["data"], function(k, v){
                var item = $("<a>").addClass("fnc-select-toggle").attr("href", "#").attr("data-value", v).html(k);
                if ( vals.indexOf(v+"") !== -1 ) item.addClass("att-selected-item");
                $(select).append(item);
            });
        } else {
            var result = $("#pop2 .space .result");
            var resetObj = $("#pop1 .space .form .formbox .body .row .edit .att-input-view[data-name='"+colName+"']");
            if ( $(resetObj).find("span").eq(0).html() != "" ) {
                $(result).html($(resetObj).html());
                $(result).find("div span").addClass("att-remove fnc-select-multi-remove");
            } else {
                $(result).html("");
            }
        }
    },


    pop3Talign: function(obj){
        try {
            var sql = editorSql.getValue();
            editorSql.setValue( getFormattedSql (sql, $("#pop3").attr("data-type")) );
        } catch (e) { modal("invalid sql:<br/>" + e, false); return; }

        var firstLine = editorSql.getSession().getDocument().getLine(0);
        editorSql.gotoLine(1, 0, true);

        modal(_m[_l]["align"]);
    },  
    pop3Tcopy: function(obj){
        var sqlStr = editorSql.getValue();

        var textarea = $("<textarea>").val(sqlStr);
        $("body").append(textarea);
        $(textarea).select();
        document.execCommand('copy');
        $(textarea).remove();

        modal(_m[_l]["copy"]);

    },  
    pop3Tapply: function(obj){

        var sql = editorSql.getValue();
        format = getFormattedSql (sql, $("#pop3").attr("data-type"));

        for(var i=20; i>0; i-=2) {
            var str = "\n";
            for(var j=0;j<i; j++) str += " ";
            format = format.split(str).join("\n");
        }
        format = format.split("\n").join(" ").trim();

        var lineContent = editorJson.session.getLine(sqlEditLineNum);
        var newLineContent = lineContent.replace(sqlEditQueryOrg, format);
        editorJson.session.replace(new ace.Range(sqlEditLineNum, 0, sqlEditLineNum, lineContent.length), newLineContent);
        
        $(obj).parent().find(".fnc-close-btn").click();
        modal(_m[_l]["apply"]);

        highlightEffectRow($("#editjson"));
    },

    pop5Tapply: function(obj){

        json = $("#pop5 .space .json .context").text().trim();
        if ( json == "" ) {
            modal(_m[_l]["starttoolemptyjson"], false);
            return;
        }
        json = JSON.stringify(JSON.parse(json));

        $("#pop1 .form .formbox .body .row a[data-target=json_panel_value]").attr("data-org",json)
        $("#pop1 .form .formbox .body .row .edit textarea[data-name=json_panel_value]").val(json);

        $("#pop5 .head .fnc-close-btn").click();
    },



};