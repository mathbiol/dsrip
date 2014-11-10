console.log('dsrip.js loaded')
dsrip={
    ref:new Firebase('https://dsrip.firebaseio.com'),
    searchTarget:{},
    dataResources:{}
};

dsrip.encodeURL=function(u){
    return encodeURIComponent(u).replace(/\./g,'%2E')
}

// set datamodel
dsrip.byId=function(id){
    return document.getElementById(id)
}
dsrip.dom=function(el){
    return document.createElement(el)
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
        var qq = document.location.search.match(/q\=([^\=\&]+)/)
        if(!qq){qq=[]}
        var q="";if (qq.length==2){var q = decodeURIComponent(qq[1])}
        dsrip.append('<div id="listResources">Find <input id="searchResources" value="'+q+'"> Add <input id="addResource" onkeyup="dsrip.addResource(this,event)"> <ol id="orderedResources"></ol></div>');
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
    // runn it if armed already
    if(q.length>0){dsrip.doSearch(dsrip.encodeURL(dsrip.byId('searchResources').value))}
    
})

dsrip.li=function(id,ordDiv){ // processing of each element of the list for the first time
    if(!ordDiv){ordDiv = dsrip.byId('orderedResources')}
    if(!dsrip.byId(id)){ // if it doesn't exist, create it
        $(ordDiv).append($('<li id="'+id+'"><span id="head_'+id+'"><b style="color:navy"><a href="'+decodeURIComponent(id)+'" target=_blank>'+decodeURIComponent(id)+'</a></b> <span style="color:green;background-color:yellow" id="edit_'+id+'" onclick="dsrip.editLi(this)">Edit</span></span><br><span id="val_'+id+'">'+
        JSON.stringify(dsrip.dataResources[id],false,1).replace(/,/g,'<br>').replace(/[{}]/g,'')
        +'</span></li>'))
        dsrip.fillSearchTarget(id);
        return dsrip.byId(id)
    }
}

dsrip.li.update=function(k,ordDiv){
   //if(!ordDiv){ordDiv = dsrip.byId('orderedResources')}
   if(!dsrip.byId('val_'+k).beingEdited){
       dsrip.byId(k).innerHTML='<span id="head_'+k+'"><a style="color:red" href="'+decodeURIComponent(k)+'" target=_blank>'+decodeURIComponent(k)+'</a> <span style="color:green;background-color:yellow" id="edit_'+k+'" onclick="dsrip.editLi(this)">Edit</span></span><br><span id="val_'+k+'">'+JSON.stringify(dsrip.dataResources[k],false,1).replace(/,/g,'<br>').replace(/[{}]/g,'')+'</span>'
   }else{
       dsrip.byId('val_'+k).style.color='red'
       $('#val_'+k+' > p > textarea').css('color','red')
   }
   dsrip.fillSearchTarget(k)
}

// everytime there is an edit in teh dataResources, update it:
dsrip.ref.child("/dataResources").on("child_changed",function(x){
    var v = x.val(), k = x.name()
    //console.log(k +' updated:',JSON.stringify(v,false,1));
    dsrip.dataResources[k]=v;
    dsrip.li.update(k);
})

// if child added, append it to the list
dsrip.ref.child("/dataResources").on("child_added",function(x){
    var v = x.val(), k = x.name()
    //console.log(k +' updated:',JSON.stringify(v,false,1));
    dsrip.dataResources[k]=v;
    var li = dsrip.li(k);
    if(li){
        if(dsrip.byId('addResource').value==li.id){ // if I'm the one who created it
            li.parentNode.insertBefore(li,li.parentNode.firstChild)
            dsrip.byId('edit_'+li.id).click() // edit it
        }
    }
})

dsrip.ref.child("/dataResources").on("child_removed",function(x){
    var k = x.name();
    var li = dsrip.byId(k);
    if(li){
        dsrip.removeMe(li)
        delete dsrip.dataResources[k]
    }
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
        //console.log(k,s)
    })
}
dsrip.enterTextArea=function(that,evt){
    if(evt.keyCode==13&(!evt.shiftKey)){
        //console.log(that)
        var k = that.parentElement.parentElement.parentElement.id;
        that.value=that.value.slice(0,-1)
        dsrip.byId('save_'+k).click();
    }
    
}

dsrip.editLi=function(that){
    var k = that.id.substring(that.id.indexOf('_')+1)
    var sp = dsrip.byId('val_'+k)
    var dt = dsrip.dataResources[k]
    sp.style.color="blue"

    sp.innerHTML='' // clear
    sp.beingEdited=true
    Object.getOwnPropertyNames(dt).map(function(att){
        var p = dsrip.dom('p'); p.id='editing_'+k+'.'+att
        p.innerHTML=att+': '+'<textarea style="vertical-align:middle" onkeyup="dsrip.enterTextArea(this,event)">'+dt[att]+'</textarea> <span style="color:red" onclick="dsrip.removeMyParent(this)">X</span>'
        sp.appendChild(p)
    })
    //add field option
    var p = dsrip.dom('p'); p.id='adding_'+k+'.newField'
    p.innerHTML='<input style="color:blue" value="new field" size=10>: '+'<textarea style="vertical-align:middle" id="olala" onkeyup="dsrip.enterTextArea(this,event)"></textarea>'
    sp.appendChild(p)

    // if there is no Save button add it
    if(!dsrip.byId('save_'+k)){
        var spSave = dsrip.dom('span')
        spSave.id='save_'+k
        spSave.style.color='red'
        spSave.innerHTML=' Save'
        spSave.onclick=function(){dsrip.saveLi(this)}
        dsrip.byId('head_'+k).appendChild(spSave)
        //dsrip.byId('edit_'+k).innerHTML+=' save';
    }
}


dsrip.saveLi=function(that){
    // save vals
    var k = that.id.substring(that.id.indexOf('_')+1);
    pp = dsrip.byId('val_'+k).children
    var j = 0 ; // lets make this as resiliant as possible, it is only one li at a time, no performance issues
    var n = k.length+9 // length of the parameter sufix
    var doc={}
    for (var i = 0 ; i<pp.length;i++){
        if(pp[i].id.substring(0,pp[i].id.indexOf('_'))=='editing'){ // to discount the possibility that other types of children were added
            j++
            if(pp[i].id.slice(pp[i].id.length-9)!=="new field"){
                doc[pp[i].id.substring(n)]=$('textarea',pp[i])[0].value
            }        
        }
    }
    // look for new new field
    var nf = dsrip.byId('adding_'+k+'.newField').getElementsByTagName('input')[0].value
    if((nf!="new field")&nf.length>0){ // if the default name was changed
        doc[nf]=dsrip.byId('adding_'+k+'.newField').getElementsByTagName('textarea')[0].value
    }
    dsrip.byId('val_'+k).beingEdited=false
    dsrip.ref.child("/dataResources/"+k).set(doc) // save new contents
    dsrip.li.update(k)
    // remove save thrigger just pressed
    // dsrip.removeMe(that) 
    
}

dsrip.addResource=function(that,evt){
    if(evt.keyCode==13&(!evt.shiftKey)){
        // create new resource
        //dsrip.ref.child("/dataResources/"+that.value).set({lala:[1,2,3]})
        var k = that.value;
        dsrip.ref.child("/dataResources/"+k).once('value',function(x){
            //console.log(x.numChildren())
            if(x.numChildren()==0){ // safe to create resource
                dsrip.ref.child("/dataResources/"+k).set({"new field":"rename and populate new field below"})
            } else{ // it exists already
                var li = dsrip.byId(k); li.hidden=false
                li.parentNode.insertBefore(li,li.parentNode.firstChild)
                dsrip.byId('edit_'+li.id).click() // edit it
            }
        })
    }
}


dsrip.removeMyParent=function(that){
    var rmSoon=function(){
        that.parentElement.parentElement.removeChild(that.parentElement)
    }
    setTimeout(rmSoon,100)
}

dsrip.removeMe=function(el){
    var rmSoon=function(){
       el.parentElement.removeChild(el) 
    }
    setTimeout(rmSoon,100)
}


