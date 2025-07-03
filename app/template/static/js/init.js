
var initFnc = {

    chartToperate: function(panelObj, obj) {
        $(panelObj).find(".chart .chart-table .table tr .att-def-extra").remove();
        $(panelObj).find(".chart .chart-table .table tr.row td .edit").remove();
        $(panelObj).find(".search .act").remove();
    },

    pop1: function(btnObj) {
        $("#pop1").hide();
        $("#pop1 .head .fnc-close-btn").click();
        $("#pop1 .head .title").html($(btnObj).attr("title"));
        $("#pop1 .space").html("");

        $("#pop1").attr("data-g", $(btnObj).attr("data-g"))
            .attr("data-i", $(btnObj).attr("data-i"))
            .attr("data-entity", $(btnObj).attr("data-entity"))
            .attr("data-mode", $(btnObj).attr("data-mode"))
            .attr("data-target", $(btnObj).attr("data-target"))
        ;
    },

    pop5: function() {
        $("#pop5").hide();        
        $("#pop5 .head input[data-name=datasource]").val("");
        $("#pop5 .head input[data-name=datasource]").attr("data-value", "");
        $("#pop5 .space .query textarea[data-name=query]").val("");
        $("#pop5 .space .query textarea[data-name=query]").attr("data-value", "");
       
        $("#pop5 .space .json .context").html("");
    },

    pop6: function(btnObj) {

        $("#pop6").hide();        
        $("#pop6 .head .subtitle").hide();    
        $("#pop6 .space").html("");

        if($(btnObj).attr("data-type") == 'agent') {
            $("#pop6 .head .title").html("Agent");
            $("#pop6").width(1000);
            
        } else {
            $("#pop6 .head .title").html("View");
            $("#pop6").width(600);
        }
    }
};
