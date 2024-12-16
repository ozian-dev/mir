
var formFnc = {

    chartTinsertTimage_server : function(obj) {
        formFnc["chartTinsertTimage"](obj);
    },
    chartTinsertTimage : function(obj) {
        formFnc["chartTexecuteTimage"](obj);
    },

    chartTinsertTfiles_server : function(obj) {
        formFnc["chartTinsertTfiles"](obj);
    },
    chartTinsertTfiles : function(obj) {
        formFnc["chartTexecuteTfiles"](obj);
    },

    chartTexecuteTimage_server : function(obj) {
        formFnc["chartTexecuteTimage"](obj);
    },
    chartTexecuteTimage : function(obj) {
        
        if (!$(obj).prev()[0].files[0]) {
            modal(_m[_l]["nofile"]);
            return;
        }
        var formData = new FormData();
        formData.append("g", $(obj).attr("data-g"));
        formData.append("i", $(obj).attr("data-i"));
        formData.append("entity", $(obj).attr("data-entity"));
        formData.append("mode", $(obj).attr("data-mode"));
        formData.append("target", $(obj).attr("data-target"));
        formData.append("type", $(obj).attr("data-type"));
        formData.append("files[]", $(obj).prev()[0].files[0]);
        
        var url = _p["const"]["uploadFile"];
        url = postFnc["getUrl"](url, obj);

        callAjax(url, function(resObj){
            modal("ok");
            var values = "";
            for (var i=0; i<resObj["data"].length; i++) {
                var item = resObj["data"][i];
                values += item[item["return"]] + ",";
            }

            values = values.slice(0, -1);
            var inputObj = $(obj).parent().parent().find("[data-name='"+resObj["target"]+"']");
            $(inputObj).val(values);
            $(inputObj).attr("data-value", values);
            $(inputObj).attr("data-change", 1);

            $("#pop1 .progress").hide();

        }, 'POST', formData);
    },

    chartTexecuteTfiles_server : function(obj){
        formFnc["chartTexecuteTfiles"](obj);
    },
    chartTexecuteTfiles : function(obj){
        
        if (!$(obj).prev()[0].files[0]) {
            modal(_m[_l]["nofile"]);
            return;
        }
        var formData = new FormData();
        formData.append("g", $(obj).attr("data-g"));
        formData.append("i", $(obj).attr("data-i"));
        formData.append("entity", $(obj).attr("data-entity"));
        formData.append("mode", $(obj).attr("data-mode"));
        formData.append("target", $(obj).attr("data-target"));
        formData.append("type", $(obj).attr("data-type"));
        
        var files = $(obj).prev()[0].files;
        for (var i = 0; i < files.length; i++) {
            formData.append("files[]", files[i]);
        }
        
        var url = _p["const"]["uploadFile"];
        url = postFnc["getUrl"](url, obj);

        callAjax(url, function(resObj){

            modal("ok");

            var inputObj = $(obj).parent().parent().find("[data-name='"+resObj["target"]+"']");
            var values = "";
            var views = "";
            
            for (var i=0; i<resObj["data"].length; i++) {
                var item = resObj["data"][i];
                values += item[item["return"]] + ",";

                var name = item["url"].split("/").pop();
                var nameObj = $("<span>").addClass("fnc-delete-item").attr("data-value", item[item["return"]]).html(name);
                $(inputObj).append($("<div>").append(nameObj));
            }
            values = values.slice(0, -1);

            if (!$(inputObj).attr("data-value") || $(inputObj).attr("data-value") == "") $(inputObj).attr("data-value", values);
            else $(inputObj).attr("data-value", $(inputObj).attr("data-value") + "," + values);

            $(inputObj).attr("data-change", 1);

            $("#pop1 .progress").hide();

        }, 'POST', formData);
    },

    chartTinsertTexcel : function(obj){

        if ( $(obj).attr("data-target-sub") == "bulk" ) {
            if (!$(obj).prev()[0].files[0]) {
                modal( _m[_l]["nofile"], false);
                $("#pop1").find(".progress").hide();
                return false;
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
            formData.append("target-sub", "bulk");
            formData.append("type", type);
            formData.append("file", $(obj).prev()[0].files[0]);
    
            var url = _p["const"]["uploadExcel"];
            url = postFnc["getUrl"](url, obj);
    
            callAjax(url,  closePop1, 'POST', formData);

        } else {

            var data = getPostData ( null, obj, $("#pop1 .space .formbox"), false );

            if ( !data ) return false ;

            var formData = new FormData();
            formData.append("g", data["g"]);
            formData.append("i", data["i"]);
            formData.append("entity", data["entity"]);
            formData.append("mode", data["mode"]);
            formData.append("run", "real");
            formData.append("target", data["target"]);
            formData.append("type", "excel");
            if (data["@data"]["new"] && data["@data"]["new"][0]) {
                for ( var k in data["@data"]["new"][0] ) {
                    if (k !== "file") formData.append(k , data["@data"]["new"][0][k]);
                }
            }
            formData.append("file", $(obj).parent().parent().find(".att-input-file")[0].files[0]);


            var url = _p["const"]["uploadExcel"];
            url = postFnc["getUrl"](url, obj);

            callAjax(url, closePop1, 'POST', formData);
        }
        return true;
    }
};

