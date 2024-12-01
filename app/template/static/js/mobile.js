

var mobileFnc = {

    reload: function(obj) {

        var panelObj = getPanelObj(obj);
        $(panelObj).find(".head .tools a[data-type=reload]").click();

    },
    
    search: function(obj) {
        
        var panelObj = getPanelObj(obj);
        var customObj = $(panelObj).find(".search .custom");

        $(customObj).hide();
        $(customObj).prepend(_mobileHtml["search-layer"]);
        $(customObj).width( $("body").width() );
        $(customObj).css("left","0");
        
        $(customObj).slideDown();
    },

    search_apply: function(obj) {
        mobileFnc["reload"](obj);
        mobileFnc["search_cancel"](obj);
    },

    search_cancel: function(obj) {
        var customObj = $(obj).parent().parent();
        $(customObj).slideUp("normal", function(){
            $(customObj).find(".m-custom-search-layer").remove();
            $(customObj).css("left","-10000px");
        });
    }
}


$("body")
.on ("click", ".fnc-link-mobile", function() {
    mobileFnc[$(this).attr("data-target")]($(this));
    return;
})
;


var _mobileHtml = {}

_mobileHtml["search-layer"] = `
<div class="m-custom-search-layer">
    <a href="#" class="fnc-link-mobile" data-target="search_apply">search</a>
    <a href="#" class="fnc-link-mobile" data-target="search_cancel">cancel</a>
</div>
`;