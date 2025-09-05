
var _eventMouseY = 0;
$("body").mousemove(function(e) {
    _eventMouseY = e.clientY;
});


$("body")
// global function
////////////////////////////////////////////////////////////////////
.on ("click", "a", function() {

    if ($(this).attr("target") == "_win") location.href = $(this).attr("href");
    else if ($(this).attr("target") == "_blank") window.open($(this).attr("href"));

    return false;
})
.on ("change", "select", function() {
    $("#gl .title")
    $(this).attr('data-value', $(this).val());
})
.on ("keyup", ".att-input-text", function() {
    $(this).attr('data-value', $(this).val());
})
.on ("keyup", ".att-input-textarea", function() {
    $(this).attr('data-value', $(this).val());
})
.on ("change", ".att-input-date", function() {
    $(this).attr('data-value', $(this).val());
})
.on ("change", ".att-input-file", function(e) {
    var files = e.target.files;
    var fileStr = "";
    for (var i = 0; i < files.length; i++) {
        fileStr += files[i].name + ",";
    }
    $(this).attr("data-value", fileStr.slice(0, -1));
})

.on ("click", ".fnc-close-btn", function() {

    if ($(this).attr("title") == "date-pick-close") {
        var tarObj = $(this).parent().parent();
        $(tarObj).slideUp(function(){$(tarObj).remove();});

    } else if ($(this).attr("title") == "draw-chart-close") {
        var panelObj = getPanelObj(this);
        var tarObj = $(panelObj).find(".search .custom .draw-chart");
        $(tarObj).slideUp(function(){$(tarObj).remove();});

    } else if ($(this).attr("title") == "dynamic-chart-close") {
        var panelObj = getPanelObj(this);
        var tarObj = $(panelObj).find(".search .dynamic-chart");
        $(tarObj).slideUp(function(){$(tarObj).remove();});

    } else if ($(this).attr("title") == "pop1-close") {

        $("#pop1").slideUp();
        $("#pop1 .progress").hide();
        $("#pop2").slideUp();
        $("#pop3").slideUp();
        $("#pop3 .head .console").slideUp();
        $("#pop4").slideUp();
        $("#pop5").slideUp();

        $("#pop1").attr("data-g", "").attr("data-i", "").attr("data-entity", "").attr("data-mode", "");
        $("#pop2").attr("data-g", "").attr("data-i", "").attr("data-entity", "").attr("data-mode", "");
        $("#pop3").attr("data-g", "").attr("data-i", "").attr("data-entity", "").attr("data-mode", "");
        $("#pop5").attr("data-g", "").attr("data-i", "").attr("data-entity", "").attr("data-mode", "");

        try { editorJson.destroy()} catch(e){} ;
        try { editorSql.destroy()} catch(e){} ;


    } else if ($(this).attr("title") == "pop2-close") {

        $("#pop3 .head .console").slideUp();

        $("#pop2").slideUp();
        try { editorJson.destroy()} catch(e){} ;

        $("#pop2").attr("data-g", "").attr("data-i", "").attr("data-entity", "").attr("data-mode", "");
        $("#pop3").attr("data-g", "").attr("data-i", "").attr("data-entity", "").attr("data-mode", "");

    } else if ($(this).attr("title") == "pop3-close") {
        
        $("#pop3 .head .console").slideUp();
        
        $("#pop3").slideUp();
        try { editorSql.destroy()} catch(e){} ;
        $("#pop4").slideUp();
        
        $("#pop3").attr("data-g", "").attr("data-i", "").attr("data-entity", "").attr("data-mode", "");

    } else if ($(this).attr("title") == "pop5-close") {

        $("#pop5").slideUp();

    } else if ($(this).attr("title") == "pop6-close") {

        $("#pop6").slideUp();

        if ($("#pop6 .head .fnc-close-btn").attr("data-idx")) {

            var post = { 
                "entity": "chart",
                "mode": "chat",
                "target": 'del',
                "i": $("#pop6").attr("data-i"),
                "idx": $("#pop6 .head .fnc-close-btn").attr("data-idx"),
            };
            var url = _p["const"]["chat"];
            callAjax(url, function(){}, 'POST', JSON.stringify(post));
        }

    } else if ($(this).attr("title") == "console-close") {
        
        $("#pop3 .head .console").slideUp();
        
    } else if ($(this).attr("title") == "modal-close") {
        $(this).parent().parent().slideUp(function() {
            $(this).remove();
        });
    } else if ($(this).attr("title") == "pop-layer-close") {
        $("#pl").hide();
    }  
})

// logo function
////////////////////////////////////////////////////////////////////

.on ("mouseover", ".fnc-logo-group", function() {
    $("#gl .title").html($(this).attr("data-title"));
})
.on ("mouseout", ".fnc-logo-group", function() {
    $("#gl .title").html($("#gl .title").attr("data-title"))
})


// menu function
////////////////////////////////////////////////////////////////////

.on ("click", ".fnc-menu-1", function() {
    if ($(this).next().hasClass("level-2")) {
        $(this).parent().parent().find(".level-2").slideUp();
        $(this).next().slideDown();
    }
})
.on ("click", ".fnc-menu-2", function() {

    $("#gm").find(".att-selected-unit").removeClass("att-selected-unit");
    $(this).addClass("att-selected-unit");

    var title = $(this).text();
    $("#gh .title").html(title);

    $("#pop1").slideUp();
    $("#pop2").slideUp();
    $("#pop3").slideUp();
    $("#pop4").slideUp();
    $("#pop5").slideUp();
    $("#pop6").slideUp();

    var url = _p["const"]["workplace"] 
            + "?.g=" + $(this).attr("data-g") 
            + "&.i=" + $(this).attr("data-i") ;
    if (_p["mode"] == "click") putHistory(url); 
    callAjax(url, renderWorkplace);

    if (_p["device"] =="m") {
        $("#gh .fnc-side-fold").click();
    }

})

// head function
////////////////////////////////////////////////////////////////////
.on ("click", ".fnc-side-fold", function() {

    $(this).toggleClass("act-rotation-0");
    if ($(this).hasClass("act-rotation-0")) {
        $("#col1").css("min-width", "0");
        $("#col1").animate({"width":"0"}, 500);
    } else {
        $("#col1").animate({"width":"220px"}, 500, function(){
            $("#col1").css("min-width", '220px');
        });
    }
})
.on ("click", ".fnc-user-edit", function() {

    $("#pop1").slideUp();
    $("#pop2").slideUp();
    $("#pop3").slideUp();
    $("#pop4").slideUp();
    $("#pop5").slideUp();
    $("#pop6").slideUp();

    renderPop1($(this), "user");
})




// unified button funtion
////////////////////////////////////////////////////////////////////

.on ("click", ".fnc-link", function() {
    
    if( $(this).hasClass("att-disable") ) return;

    var panelObj = getPanelObj($(this));
    if ($(panelObj).find(".progress").is(":visible")) {
        modal( _m[_l]["run"] );
        return;
    }

    var taskName = $(this).attr("data-entity") + "." + $(this).attr("data-target")
    if ( taskName in _p["actionTask"] ) {
        modal( _m[_l]["run"] );
        return;
    }

    var fncName;
    try {
        if ( $(this).attr("data-post")) {
            fncName = $(this).attr("data-entity") + "T" + $(this).attr("data-mode") + "T" + $(this).attr("data-type");
            if ( $(this).attr("data-method") == "form") {
                if ( formFnc[fncName]($(this)) ) {
                    $("#pop1 .progress").show();
                } else {
                    $("#pop1 .progress").hide();
                }
            } else {
                postFnc[fncName]($(this));
            }

        } else {
            fncName = $(this).attr("data-entity") + "T" + $(this).attr("data-mode");
            playFnc[fncName]($(this));
        }
    } catch(e) {
        console.log(e)
        modal( "no function or function error : " + fncName, false );
    } 

    return;
})

.on ("click", ".fnc-link-page", function() {
    
    var panelObj = getPanelObj($(this));
    $(panelObj).find(".search .custom .item .value input[data-name='.o']").attr("data-value", $(this).attr("data-offset"));
    $(panelObj).find(".head .tools .att-tool-reload").click();
    return;
})

.on ("click", ".fnc-action-aync", function() {

    var actBtn = $('#pan'+$(this).attr('data-i')).find(".action a.fnc-link[data-target='"+$(this).attr('data-target')+"' ]");
    $(actBtn).attr("data-run", "done");
    $(actBtn).click();

    $('#'+$(this).attr('data-modal')).find('.context a.fnc-close-btn').click();
    return;
})



// table view function
////////////////////////////////////////////////////////////////////

.on ("click", ".fnc-text-view", function() {

    var target = $(this).parent();

    var offset = $(target).offset();
    var limitPoint = $(window).height()-300-50;

    if ($(target).find(".att-text-view").length == 0 ) {
        var textView = $("<div>").addClass("att-text-view fnc-text-view-out").html($(this).html());
        textView.css("left", offset.left-1);
        textView.width($(target).width()+1);
        textView.css("background-color", $(target).css("background-color"));
  
        if ( limitPoint > offset.top ) textView.css("top", offset.top-1);
        else textView.css("bottom", $(window).height() - (offset.top + $(target).outerHeight()));
      
        $("body").append(textView);
        $(textView).slideDown();
        setTimeout(function() {
            try{
                $(textView).slideUp(function() {$(textView).remove();});
            } catch(e) {}

        }, 5000);
    }
})
.on ("mouseout", ".fnc-text-view-out", function() {
    $(this).slideUp(function() {$(this).remove();});
})
.on ("keyup", ".fnc-data-find", function() { 

    var panelObj = getPanelObj($(this));
    var pid = $(panelObj).attr("data-i")
    var dheadsObj =_p["p"]["i"][pid];
    var seed = $(this).val().toLowerCase();

    if ( $(panelObj).attr("data-type") == "table" ) {

        if ($(panelObj).attr("data-type") == "table") {

            var tableObj = $(panelObj).find(".chart .chart-table .table");

            $(tableObj).find('tr.row').each(function(i,row) {
                if (seed == "") {
                    $(row).show();
                } else {
                    var obj = $(row).find("td").not(".att-key");
                    if ($(obj).length == 0) return;
                    var matched = false;

                    $(obj).each(function(j,e) {
                        if ( $(e).text().toLowerCase().indexOf(seed) != -1 ) {
                            matched = true;
                            return;
                        }
                    });
                    if (matched == false) $(row).hide();
                    else {
                        $(row).show();
                    }
                }
            });

            renderFnc["tableSummary"](panelObj);
        }
    } else if ( $(panelObj).attr("data-type") == "chart" ) {

        if (seed == "") {
            var showAllObj = $(panelObj).find(".chart .chart-legend .btns .btn")[0];
            var clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            showAllObj.dispatchEvent(clickEvent);
        
        } else {

            var chartLegendObj = $(panelObj).find(".chart .chart-legend .items .item");
            $(chartLegendObj).each(function(i, item) {
                if ( $(item).text().toLowerCase().indexOf(seed) != -1 ) {
                    if ($(item).hasClass("hidden")) {

                        var clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        item.dispatchEvent(clickEvent);
                    }
                } else {
                    if (!$(item).hasClass("hidden")) {

                        var clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        item.dispatchEvent(clickEvent);
                    }
                }
            })
        }
    }
}) 
.on ("click", ".chart-table .table tr.row", function(e) {
    
    $("#pop1").find(".head .fnc-close-btn").click();

    var panelObj = getPanelObj($(this));

    tableToolFnc["rowClick"]($(panelObj), $(this), e);
})
.on ("mouseover", ".chart-table .table tr.row", function() {

    var panelObj = getPanelObj(this);
    var tInfo = _p["p"]["i"][$(panelObj).attr("data-i")]["chart"]["tools"];
    if ( tInfo["operate"] && tInfo["operate"] == 2) return;

    $(this).find('td').addClass("att-tr-over-highlight");
})
.on ("mouseout", ".chart-table .table tr.row", function() {
    $(this).find('td').removeClass("att-tr-over-highlight");
})
.on ("click", ".chart-table .table tr th .name", function() { 

    var panelObj = getPanelObj(this);
    var thObj = $(this).parent();
    var pid = $(panelObj).attr("data-i");
    var pos = _p["p"]["i"][pid]["chart"]["heads_orders"].indexOf($(thObj).attr("data-key"));

    var order = $(thObj).attr("data-order") ;
    var type = $(thObj).attr("data-type") ;
    var display = $(thObj).attr("data-display") ;
    if (typeof display === "undefined") display = "";

    if ( order == "asc") order = "desc";
    else order = "asc";

    $(thObj).attr("data-order", order) ;
    $(thObj).parent().find("th .name").removeClass("att-order-asc att-order-desc");
    $(this).addClass("att-order-" + order);

    var res = [];
    var localCnt = 0;

    $(thObj).parent().parent().find("tr.row").each(function(i1,e1) {
        var tmp = [i1, $(e1).find("td").eq(pos).text()]
        if (type=="number" && display == "") {
            tmp = [i1, parseFloat($(e1).find("td").eq(pos).attr("data-org"))];
        }
        res.push(tmp);
        localCnt++;
    });


    res = sortArr(res, 1, order);

    var clObj = $(thObj).parent().parent().find("tr.row").clone();
    $(thObj).parent().parent().find("tr.row").remove();

    $.each (res, function(i,arr) {
        $(thObj).parent().parent().find("tr.summary").before($(clObj).eq(arr[0]).clone());
    });

    $(clObj).remove();

})
.on ("click", ".fnc-date-pick", function() {
    
    var datePick = $(_htmls["date-pick"]);
    
    $(this).parent().parent().append(datePick);
    $(datePick).attr("data-id", $(this).parent().parent().parent().parent().parent().attr("id"));
    
    datePick.slideDown();
})
.on ("click", ".fnc-date-pick-value", function() {

    var val = $(this).attr("data-value");

    $(this).parent().find('input[name="odn-from"]').val();
    
    if(val == "custom") {
        var from = $(this).parent().parent().find("input[name='att-from']").val();
        var to = $(this).parent().parent().find("input[name='att-to']").val();
        if ( from == "" || to == "" ) return modal (_m[_l]["fromto"]);
        var val = from + "~" + to;
    }

    var panelObj = getPanelObj($(this));
    var tar = $(panelObj).find(".search .custom .item .value .fnc-date-pick");
    $(tar).attr("data-value", val).html(val);

    $(panelObj).find(".search .custom .item .date-pick .head .fnc-close-btn").click();

})
.on ("click", ".fnc-link-id", function() {

    // info[0] : target panel id
    // info[1] : current value
    // info[2] : target custom search key (label)

    var panelObj = getPanelObj($(this));
    var rowObj = $(this).parent().parent().parent();
    var info = JSON.parse($(this).attr("data-link"));
    var pid = $(panelObj).attr("data-i");

    $.each(info, function(i, row){

        var tarPObj = $("#pan" + row[0]);
        var tarSObj = $(tarPObj).find(".search .custom .item .value");

        $.each(row[1], function(j, item) {

            var idx = _p["p"]["i"][pid]["chart"]["heads_orders"].indexOf(item);
            
            if ($(rowObj).find(".att-def-extra").length > 0) idx++;

            var tarObj = $(rowObj).find("td").eq(idx);
            var val = $(tarObj).attr("data-org");

            if( idx < 0 ) {
                val = getHashParamValue(panelObj, item);
            }

            var skey = "[data-name='"+row[2][j]+"']";
            var skeyObj = $(tarSObj).find(skey);
            $(skeyObj).attr("data-value", val).val(val).prop("selected", true);

            if($(skeyObj).is('a')){
                if (val == "") $(skeyObj).html("none");
                else $(skeyObj).html(val);
            }
        });

        var tarDateObj = $(tarPObj).find(".search .custom .item .value .fnc-date-pick");
        var srcDateObj = $(panelObj).find(".search .custom .item .value .fnc-date-pick");

        if ( srcDateObj.length == 1 && tarDateObj.length == 1) {
            $(tarDateObj).attr("data-value", $(srcDateObj).attr("data-value"));
            $(tarDateObj).html($(srcDateObj).html());   
        }

        $(tarPObj).find(".head .tools a[data-type=reload]").click();
    });
})


// common edit function
////////////////////////////////////////////////////////////////////

.on ("click", ".fnc-select-one", function() {
    $(this).parent().find('.att-selected-item').removeClass('att-selected-item');
    $(this).addClass('att-selected-item');
    
    if ( $(this).attr("data-trigger") ) {
        window[$(this).attr("data-trigger")]($(this));
    }
})

.on ("click", ".fnc-select-two", function() {
    var selects = $(this).parent().attr("data-selects");
    if (selects && selects != "" ) selects = JSON.parse(selects);
    else selects = [];

    if ($(this).hasClass("att-selected-item")) {
        index = selects.indexOf($(this).attr("data-value"));
        if (index !== -1) {
            selects.splice(index, 1);
        }
        $(this).removeClass("att-selected-item");
    } else {
        selects.push($(this).attr("data-value"));
        $(this).addClass("att-selected-item");
    }

    if (selects.length == 3) {
        var tmp = selects[0];
        tmp = tmp.split("'").join("\\'");
        $(this).parent().find("a[data-value='"+tmp+"']").removeClass("att-selected-item");
        selects.splice(0, 1); 
    }

    $(this).parent().attr("data-selects", JSON.stringify(selects));
})

.on ("click", ".fnc-select-toggle", function() {
    $(this).toggleClass('att-selected-item');
})

.on ("click", ".fnc-select-all", function() {
    
    if ($(this).hasClass("att-selected-item")) {
        $(this).removeClass("att-selected-item");
        $(this).parent().parent().parent().find(".fnc-selects-td .fnc-select-toggle").removeClass("att-selected-item");

    } else {
        $(this).addClass("att-selected-item");
        $(this).parent().parent().parent().find(".fnc-selects-td .fnc-select-toggle").addClass("att-selected-item");
    }
})

.on ("click", ".fnc-select-multi-add", function() {

    var thisValue = $(this).attr("data-value");
    var list = $("#pop2 .space .result div span");
    var isExist = false;
    $.each(list, function(i, item){
        if( $(item).attr("data-value") == thisValue ){
            isExist = true;
            modal (_m[_l]["duplicated"])
            return;
        }
    });

    if ( !isExist ) {

        var viewArr = [];
        $("#pop2 .space .select .tab .att-selected-item").each(function(i, item){
            viewArr.push($(item).text());
        });

        var item = $("<span>").addClass("att-remove fnc-select-multi-remove")
                              .attr("data-value", thisValue)
                              .html(viewArr.join(" > "));
        $("#pop2 .space .result").prepend($("<div>").html(item));
    }
})

.on ("click", ".fnc-select-multi-remove", function() {
    $(this).parent().remove();
})

.on ("click", ".fnc-put-array", function() {
    var valArr = [];
    var valStr = $(this).parent().attr("data-value"); 
    if (valStr) valArr = JSON.parse(valStr);

    if ($(this).hasClass("att-selected-item")) {
        valArr.push ($(this).attr("data-value"));
        
    } else {
        valArr = valArr.filter(item => item !== $(this).attr("data-value"));
    }

    $(this).parent().attr("data-value", JSON.stringify(valArr));
})


.on ("click", ".fnc-select-mode", function() {

    var mode = $(this).attr("data-value");
    
    var items = $("<div>");
    var target = $(this).parent().parent().find(".dac-axis[data-name=x] .fnc-selects");
    $(target).attr("data-selects", "");
    $.each($(target).find("a"), function(i, item){
        var val = $(item).attr("data-value");
        var txt = $(item).text();
        var a = $("<a>").attr("href", "#").attr("data-value", val).html(txt);
        if(mode == "normal") {
            $(a).addClass("fnc-select-one");
        } else {
            $(a).addClass("fnc-select-two");
        }
        $(items).append(a);
    });
    $(target).html($(items).html());

    var items = $("<div>");
    var target = $(this).parent().parent().find(".dac-axis[data-name=y] .fnc-selects");
    $.each($(target).find("a"), function(i, item){
        var val = $(item).attr("data-value");
        var txt = $(item).text();
        var a = $("<a>").attr("href", "#").attr("data-value", val).html(txt);
        if(mode == "normal") {
            $(a).addClass("fnc-select-toggle fnc-put-array");
        } else {
            $(a).addClass("fnc-select-one");
        }
        $(items).append(a);
    });
    $(target).html($(items).html());
})


.on ("click", ".fnc-delete-item", function() {

    $(this).toggleClass("att-cancel");

    var target = $(this).parent().parent().find(".fnc-delete-item");
    var val = "" ;
    $.each(target, function(i, item) {
        if ( !$(item).hasClass("att-cancel"))
            val += $(item).attr("data-value") + ",";
    });
    val = val.slice(0, -1);
    $(this).parent().parent().attr("data-value", val);
})


.on ("change", ".formbox .body .row .edit .att-input-select", function() {

    if($(this).next().is("select")) {

        var pid = $("#pop1").attr("data-i");
        var mode = $("#pop1").attr("data-mode");
        var target = $("#pop1").attr("data-target");
        var selects = $(this).parent().find("select");
        var values = _p["p"]["i"][pid]["chart"][mode][target]["columns"][$(this).attr("data-name")]["values"]["data"];

        var selectLength = $(selects).length;
        var start = parseInt($(this).attr("data-seq")) + 1;

        for ( i=start ; i<selectLength ; i++ ) {

            var tarSelect =  $(selects).eq(i);
            $(tarSelect).html($("<option>").val("").html("none"));
            $(tarSelect).attr("data-value", "");

            if ( i == start ) {
                var cursor = values;
                for( k=0; k<start; k++ ){
                    cursor = cursor[$(selects).eq(k).attr("data-value")];
                }
                $.each(cursor, function(k,v){
                    var option = $("<option>").val(v).html(k);
                    if ( v instanceof Object ) option = $("<option>").val(k).html(k);
                    $(tarSelect).append(option);
                });
            }
        }
    }
})

// download function
////////////////////////////////////////////////////////////////////

.on ("click", ".fnc-download-excel-sample", function() {
    var panelObj = $("#pan" + $("#pop1").attr("data-i"));
    var url = getPanelUrl(panelObj, {".t":"sample", "target": $("#pop1").attr("data-target")});
    location.href = url;
})

.on ("click", ".fnc-download-excel-code", function() {
    var panelObj = $("#pan" + $("#pop1").attr("data-i"));
    var url = getPanelUrl(panelObj, {".t":"code", "target": $("#pop1").attr("data-target")});
    location.href = url;
})

// json edit function
////////////////////////////////////////////////////////////////////

.on ("keyup", ".fnc-pop2-search-box", function() {
    var str = $(this).val().toLowerCase();
    $("#pop2 .space .select .fnc-select-toggle").each(function(i,item){
        if($(item).text().toLowerCase().indexOf(str)<0) $(item).hide();
        else $(item).show();
    });
})


.on ("keyup", "#editsql", function() {

    if ( !$("#editsql").attr("data-status") || $("#editsql").attr("data-status") == "idle" ) {
        
        $("#editsql").attr("data-status", "busy");

        var sqlStr = editorSql.getValue();
        var regex = /\$\{(.+?)\}|#\{(.+?)\}/g;

        var match;
        var varsSet = new Set();

        while ((match = regex.exec(sqlStr)) !== null) {

            if (match[1]) varsSet.add(match[1]);
            if (match[2]) varsSet.add(match[2]);
            
        }
        var vars = Array.from(varsSet);
        var varsStr = vars.join(",");

        if ( varsStr != $("#editsql").attr("data-vars") ) {
            $("#editsql").attr("data-vars", varsStr);
            var preItem = "";
            $.each(vars, function(i, item){

                var checkVar = $("#pop4 .space .formbox .body .test-row .edit input[data-name='"+item+"']");
                if ( checkVar.length == 0 ) {

                    var row = $("<div>").addClass("row  test-row");
                    $(row).append($("<div>").addClass("label").html(item));
                    var input = $("<input>").addClass("att-input att-input-text")
                                            .attr("type", "text")
                                            .attr("data-name", item);
                    $(row).append($("<div>").addClass("edit").html(input));

                    if ( preItem == "") {
                        $("#pop4 .space .formbox .body").prepend(row);
                    } else {
                        var pos = $("#pop4 .space .formbox .body .test-row .edit input[data-name='"+preItem+"']");
                        $(pos).parent().parent().after(row);
                    }
                }

                preItem = item;
            });

            var inputLists = $("#pop4 .space .formbox .body .test-row .edit input");
            $.each(inputLists, function(i, item){
                if ( !vars.includes($(item).attr("data-name")) ) {
                    $(item).parent().parent().remove();
                }
            });
        }
        $("#editsql").attr("data-status", "idle");
    }
})

// panel function
////////////////////////////////////////////////////////////////////
.on ("click", ".fnc-pidxinfo", function() {
    
    if ( !$(this).next().find(".row .val").html() ) return false;

    $(this).next().toggle();
    var idStr = $(this).next().attr("id");
    setTimeout( function(){ $("#" + idStr).hide(); }, 2000 );
})
.on ("click", ".fnc-cache-clear", function() {

    var panelObj = getPanelObj(this);
    $(panelObj).find(".head .tools .att-tool-reload").attr("data-clear", 1);
    var idStr = $(this).parent().parent().hide();
    $(panelObj).find(".head .tools .att-tool-reload").click();
})
.on ("click", ".fnc-pop-info", function(e) {
    msg = _m[_l]["chartinfodbclick"];
    if ($(this).hasClass("info-green")) msg += "<br>" + _m[_l]["chartinfogreen"]
    popMsg(e,msg);
})


// widget card function
////////////////////////////////////////////////////////////////////

.on ("click", ".fnc-wcard-index", function(e) {

    var notiObj = $(_htmls["widget-noti"]);
    var sig = JSON.parse($(this).attr("data-noti"));

    var idStr = getUniqueId()
    $(notiObj).attr("id", idStr);

    $(notiObj).find("div span.value").eq(0).html(sig["red"]["value"] + " %");
    $(notiObj).find("div span.value").eq(1).html(sig["yellow"]["value"] + " %");
    $(this).parent().prepend(notiObj);

    setTimeout( function(){ $("#" + idStr).remove(); }, 2000 );
})


// view pop layer function
////////////////////////////////////////////////////////////////////

.on ("click", ".fnc-view-edit", function() {

    var keys = JSON.parse($(this).attr("data-keys"));
    var execute = $(this).attr("data-execute");
    var panelObj = $("#pan" + $(this).attr("data-i"));
    var tarObj = $(panelObj).find(".chart .chart-table .table tr.att-selected-row");
    
    var isValid = true;
    for ( key in keys) {
        var td = $(tarObj).find ("td[data-name='"+key+"'][data-org='"+keys[key]+"']");
        if (td.length != 1) {
            isValid = false;
            break;
        }
    }

    $("#pop6").hide();
    var toolsRow = $(panelObj).find(".head .tools a[data-mode=execute][data-target='"+execute+"']");
    toolsRow.click();
})

// agent prompt function
////////////////////////////////////////////////////////////////////

.on ("keyup", ".fnc-prompt", function(e) {
    if (e.key === "Enter" || e.keyCode === 13) {
        $(this).next().click()
    }
})





;