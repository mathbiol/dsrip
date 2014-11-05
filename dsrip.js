console.log('dsrip.js loaded')
dsrip={
    ref:new Firebase('https://dsrip.firebaseio.com'),
    searchTarget:{}
};

dsrip.encodeURL=function(u){
    return encodeURIComponent('http://mathbiol.github.io/openHealth/?jobs/pqiSuffolk.js').replace(/\./g,'%2E')
}

// set datamodel
dsrip.byId=function(id){
    return document.getElementById(id)
}
dsrip.append=function(html){
    $(html).appendTo('#dsripDiv')
    return this
}

dsrip.ref.child("/dataResources").once("value",function(x){ // everytime something changes
    var n = x.numChildren();
    if(n==0){ // create data model first if it doesn't exist'
        console.log('no children found in dataResources, default template entry created')
        dsrip.ref.set({
            "dataResources":{
                "someUniqueId":{
                    Date:Date(),
                    name:"some name",
                    comment:"some comment"
                }
            }
        })

    }
    console.log(n+' data resources available')
    //if($('#numResources').length==0){$('<span id="numResources"></span>').appendTo('#dsripDiv')}
    dsrip.byId('dsripHeader').textContent = 'DSRIP data resources ('+n+')';
    if(!dsrip.byId('listResources')){ // Resource list template
        dsrip.append('<div id="listResources">Find <input id="searchResources"><ol id="orderedResources"></ol></div>');
    }
    //dsrip.ref.once('value',function(x){
    dsrip.dataResources = x.val() // update the reference data, this may not be the efficinet way to do it
    var ids = Object.getOwnPropertyNames(dsrip.dataResources);
    var ordDiv = dsrip.byId('orderedResources');
    for(var i=0;i<n;i++){
        dsrip.li(ids[i],ordDiv)
    }
    // arm search box
    dsrip.byId('searchResources').onkeyup=function(evt){
        //console.log(evt)
        dsrip.doSearch(this.value);
    }

    //})
})

dsrip.li=function(id,ordDiv){ // processing of each element of the list for the first time
    if(!ordDiv){ordDiv = dsrip.byId('orderedResources')}
    if(!dsrip.byId(id)){ // if it doesn't exist, create it
        $(ordDiv).append($('<li id="'+id+'"><b style="color:navy">'+decodeURIComponent(id)+'</b> <span style="color:green;background-color:yellow" id="edit_'+id+'" onclick="dsrip.editLi(this)">Edit</span><br><span id="val_'+id+'">'+
        JSON.stringify(dsrip.dataResources[id],false,1).replace(/,/g,'<br>').replace(/[{}]/g,'')
        +'</span></li>'))
        dsrip.fillSearchTarget(id);
    }
}

dsrip.li.update=function(k,ordDiv){
   if(!ordDiv){ordDiv = dsrip.byId('orderedResources')}
   $('#'+k).html('<b style="color:blue">'+decodeURIComponent(k)+'</b> <span style="color:green;background-color:yellow" id="edit_'+k+'" onclick="dsrip.editLi(this)">Edit</span><br><span id="val_'+k+'">'+JSON.stringify(dsrip.dataResources[k],false,1).replace(/,/g,'<br>').replace(/[{}]/g,''))+'</span>'
   dsrip.fillSearchTarget(k)
}

// everytime there is an edit in teh dataResources, update it:
dsrip.ref.child("/dataResources").on("child_changed",function(x){
    var v = x.val(), k = x.name()
    console.log(k +' updated:',JSON.stringify(v,false,1));
    dsrip.dataResources[k]=v;
    dsrip.li.update(k);
})

dsrip.fillSearchTarget=function(k){ // concatenate values of all fields of an entry as targets for search
    dsrip.searchTarget[k]=k;
    Object.getOwnPropertyNames(dsrip.dataResources[k]).map(function(p){
        dsrip.searchTarget[k]+=" "+dsrip.dataResources[k][p]
    })
}

dsrip.doSearch=function(s){ // go over each entry and hide it or show it depending on search match   
    Object.getOwnPropertyNames(dsrip.searchTarget).map(function(k){
        var li = dsrip.byId(k);
        if(dsrip.searchTarget[k].match(s)||s.length==0){
            li.hidden=false
        } else {li.hidden=true}
        console.log(k,s)
    })
}

dsrip.editLi=function(that){
    var k = that.id.slice(5)
    var sp = dsrip.byId('val_'+k)
    sp.style.color="red"
    4
}


