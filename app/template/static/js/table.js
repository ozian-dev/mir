
var tableToolFnc = {

    toolClickGroup: function(panelObj, obj) {

        var tInfo = _p["p"]["i"][$(panelObj).attr("data-i")]["chart"]["tools"];

        if ($(obj).hasClass("att-selected-item")) {
            // self disable
            $(obj).removeClass("att-selected-item");

            // save disable
            $(obj).parent().find("a[data-type=save]")
                .addClass("att-disable")
                .removeClass("att-selected-item")
                .attr("data-target", null);

            tInfo["operate"] = 1;

        } else {

            $(panelObj).find(".chart .chart-table .table tr .att-tr-click-highlight").removeClass("att-tr-click-highlight");

            // self activate
            $(obj).parent().find(".att-selected-item").removeClass("att-selected-item");
            $(obj).addClass("att-selected-item");

            if ($(obj).attr("data-type") != "select") {
                // save activate
                $(obj).parent().find("a[data-type=save]")
                    .addClass("att-selected-item")
                    .removeClass("att-disable")
                    .attr("data-target", $(obj).attr("data-target"));
            } else {
                $(obj).parent().find("a[data-type=save]")
                .addClass("att-disable")
                .removeClass("att-selected-item")
                .attr("data-target", null); 
            }

            tInfo["operate"] = 2;

            $(obj).parent().find("a[data-mode=execute]")
                .removeClass("att-selected-item")
                .addClass("att-disable");

            tInfo["execute"] = 0;
        }

    },
    
    toolClick: function(panelObj, obj) {

        if($(obj).hasClass("att-disable")) return;

        if ($(obj).hasClass("att-select-group")) {

            tableToolFnc["toolClickGroup"] (panelObj, obj);

        } else {

        }
    },

    rowClick: function(panelObj, obj, event) {

        var tInfo = _p["p"]["i"][$(panelObj).attr("data-i")]["chart"]["tools"];
        if (tInfo["operate"] == 2) return;
        if ( $("#pop6").is(':visible') ) return;

        if (event.metaKey || event.ctrlKey) {
            $(obj).find('td').addClass("att-tr-click-highlight");
            
        } else {

            $(obj).parent().find("tr.row").removeClass("att-selected-row");
            
            if ($(obj).find('td').hasClass("att-tr-click-highlight")) {
                $(obj).find('td').removeClass("att-tr-click-highlight");
                var toolsRow = $(panelObj).find(".head .tools a[data-mode=execute]");
                $(toolsRow).removeClass("att-selected-item").addClass("att-disable")
                tInfo["execute"] = 0;       

            } else {
                $(obj).parent().find('td').removeClass("att-tr-click-highlight");
                $(obj).find('td').addClass("att-tr-click-highlight");
                $(obj).addClass("att-selected-row");

                var toolsRow = $(panelObj).find(".head .tools a[data-mode=execute]");
                $(toolsRow).addClass("att-selected-item").removeClass("att-disable")

                tInfo["execute"] = 2;
            }
        }
    }
}


;