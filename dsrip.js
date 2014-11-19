console.log('dsrip.js loaded')
dsrip={
    ref:new Firebase('https://dsrip.firebaseio.com'),
    searchTarget:{},
    dataResources:{}
};


// authentication
dsrip.auth=dsrip.ref.getAuth();
console.log(dsrip.auth)
if(!dsrip.auth){
    document.body.innerHTML+='<p style="color:blue">Authenticating ...</p><p style="color:red">Make sure pop-ups are not blocked for this site</p><button onclick="document.location.reload()">reload</button>'
    dsrip.ref.authWithOAuthPopup("google", function(error, authData) { 
    console.log('Auth:',error,authData);
    if(authData){
        console.log('reload',error,authData)
        document.location.reload()
    }
    
    }, 
    {
        remember: "sessionOnly",
        scope: "email"
    })
}else{    

// slight variation on encoding to account for firebase dislike of dots
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

dsrip.logout=function(){
    console.log('logout');
    alert('Connection closed. If you don\'t want to be logged back in automatically make sure you also logout of Google')
    dsrip.ref.unauth();
    location.href="https://github.com/mathbiol/dsrip"
    
}

dsrip.googleId=function(){
    console.log(dsrip.auth.uid)
    if(dsrip.byId('googleID').textContent=="googleID"){
        dsrip.byId('googleID').textContent=dsrip.auth.uid
    } else {dsrip.byId('googleID').textContent="googleID"}
}

dsrip.email=function(){
    window.open('mailto:jalmeida@mathbiol.org?subject=DSRIP catalog user activation&body=(uid:"'+dsrip.auth.uid+'",email:"'+dsrip.auth.google.email+'")%0D%0A ...')
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
    dsrip.byId('dsripHeader').innerHTML = '<h3><a href="https://github.com/mathbiol/dsrip" target=_blank>*</a>DSRIP data resources<br><span style="color:green;font-size:12px">'+n+' available to <span id="emailAuth" style="color:blue" onclick="dsrip.email()">'+dsrip.auth.google.email+'</span> <button onclick="dsrip.logout()">logout</button> [<span style="color:blue" id="googleID" onclick="dsrip.googleId()">googleID</span>] <br>as of '+Date()+'</span></span></h3>';
    if(!dsrip.byId('listResources')){ // Resource list template
        var qq = document.location.search.match(/q\=([^\=\&]+)/)
        if(!qq){qq=[]}
        var q="";if (qq.length==2){var q = decodeURIComponent(qq[1])}
        dsrip.append('<div id="listResources">Find <input id="searchResources" value="'+q+'" onclick="dsrip.doSearch(this.value)"> Add <input id="addResource" onkeyup="dsrip.addResource(this,event)"> <ol id="orderedResources"></ol></div>');
        //if(qq.length==2){$('#searchResources').click()}
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
    if(q.length>0){dsrip.doSearch(dsrip.byId('searchResources').value)}
    
})

dsrip.li=function(id,ordDiv){ // processing of each element of the list for the first time
    if(!ordDiv){ordDiv = dsrip.byId('orderedResources')}
    if(!dsrip.byId(id)){ // if it doesn't exist, create it
        dsrip.stringifyLi(id)
        dsrip.fillSearchTarget(id);
        return dsrip.byId(id)
    }
}

dsrip.stringifyLi=function(k,doc,ol){
    if(!doc){doc=dsrip.dataResources[k]}
    if(!ol){ol=dsrip.byId('orderedResources')}
    var url = decodeURIComponent(k);
    var li = dsrip.dom('li'); li.id=k
    li.innerHTML = '<span id="head_'+k+'"><b style="color:navy"><a href="'+url+'" target=_blank>'+url+'</a></b> <span style="color:green;background-color:yellow" id="edit_'+k+'" onclick="dsrip.editLi(this)">Edit</span></span>'
    if(doc["new field"]){delete doc["new field"]}
    var tb = dsrip.doc2table(doc);tb.id='val_'+k;li.appendChild(tb)
    $(ol).append($(li))
}

dsrip.doc2table=function(doc){
    var tb=document.createElement('table')
    var tby=document.createElement('tbody');tb.appendChild(tby);
    Object.getOwnPropertyNames(doc).map(function(p){
        var tr=document.createElement('tr');tby.appendChild(tr); 
        var td1=document.createElement('td');tr.appendChild(td1);
        td1.style.color='blue'
        var td2=document.createElement('td');tr.appendChild(td2);
        td2.style.color='green'
        td1.textContent=p;td2.textContent=doc[p]
    })
    return tb
}

dsrip.li.update=function(k,ordDiv){
   //if(!ordDiv){ordDiv = dsrip.byId('orderedResources')}
   if(!dsrip.byId('val_'+k).beingEdited){
       //dsrip.byId(k).innerHTML='<span id="head_'+k+'"><a style="color:red" href="'+decodeURIComponent(k)+'" target=_blank>'+decodeURIComponent(k)+'</a> <span style="color:green;background-color:yellow" id="edit_'+k+'" onclick="dsrip.editLi(this)">Edit</span></span><br><span id="val_'+k+'">'+JSON.stringify(dsrip.dataResources[k],false,1).replace(/,/g,'<br>').replace(/[{}]/g,'')+'</span>'
       //var url = decodeURIComponent(k), li=dsrip.byId(k), doc=dsrip.dataResources[k]
       //li.innerHTML='<span id="head_'+k+'"><b style="color:navy"><a href="'+url+'" target=_blank>'+url+'</a></b> <span style="color:green;background-color:yellow" id="edit_'+k+'" onclick="dsrip.editLi(this)">Edit</span></span>'
       //var tb2 = dsrip.doc2table(doc);tb.id='val_'+k;li.appendChild(tb);
       var tb = dsrip.byId('val_'+k)
       dsrip.compareTable(tb,dsrip.dataResources[k]);
   }else{ // warn of conflicting edit in progress
       $(dsrip.byId('val_'+k)).find('span,textarea,input').css('color','red')
   }
   if(!dsrip.byId('edit_'+k)){dsrip.byId(k).children[0].innerHTML+='<span style="color:green;background-color:yellow" id="edit_'+k+'" onclick="dsrip.editLi(this)">Edit</span>'}
   dsrip.fillSearchTarget(k)
}

dsrip.compareTable=function(tb,doc){ // edit table according to updated doc
    // identify rows
    var tr = tb.children[0].children
    for(var i=0;i<tr.length;i++){
        tr[i].id=tb.id+'.'+tr[i].children[0].textContent
        tr[i].children[0].id=tr[i].id+'.0'
        tr[i].children[1].id=tr[i].id+'.1'
    }
    // change color of updated fields
    for(var i=0;i<tr.length;i++){
        var f = tr[i].children[0].textContent;
        if(doc){
        if(doc[f]){
            if(doc[f]!=tr[i].children[1].textContent){
                tr[i].children[1].style.color="purple"
                tr[i].children[1].textContent=doc[f]
            } 
        } else {
            tr[i].style.textDecoration='line-through'
            tr[i].children[0].style.color="red"
            tr[i].children[1].style.color="red"
        }
        }
    }
    // find new fields now
    if(doc){
    Object.getOwnPropertyNames(doc).map(function(p){
        if(!dsrip.byId(tb.id+'.'+p)){
            var trp=document.createElement('tr');tb.children[0].appendChild(trp)
            var td0=document.createElement('td');trp.appendChild(td0)
            var td1=document.createElement('td');trp.appendChild(td1)
            td0.textContent=p;td0.style.color="purple"
            td1.textContent=doc[p];td1.style.color="purple"
        }
    })
    }
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
        //dsrip.removeMe(li)
        $(li).find('td,a').css('color','red').css('text-decoration','line-through')
        $(li).find('#edit_'+k).remove()
        delete dsrip.dataResources[k]
    }
})

dsrip.fillSearchTarget=function(k){ // concatenate values of all fields of an entry as targets for search
    dsrip.searchTarget[k]=decodeURIComponent(k);
    if(dsrip.dataResources[k]){
    Object.getOwnPropertyNames(dsrip.dataResources[k]).map(function(p){
        dsrip.searchTarget[k]+=" <"+p+">:"+dsrip.dataResources[k][p]
    })
    }
    dsrip.searchTarget[k]=dsrip.encodeURL(dsrip.searchTarget[k])
}

dsrip.doSearch=function(s){ // go over each entry and hide it or show it depending on search match   
    s = dsrip.encodeURL(s)
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
    } else if(nf="new field"){delete doc[nf]}
    dsrip.byId('val_'+k).beingEdited=false
    dsrip.removeMe('save_'+k)// remove save trigger
    dsrip.byId('val_'+k).innerHTML=dsrip.doc2table(dsrip.dataResources[k]).innerHTML // rebuild old table
    dsrip.ref.child("/dataResources/"+k).set(doc) // save new contents
    dsrip.li.update(k)
    // remove save thrigger just pressed
    // dsrip.removeMe(that) 
    
}

dsrip.addResource=function(that,evt){
    if(evt.keyCode==13&(!evt.shiftKey)){
        // create new resource
        //dsrip.ref.child("/dataResources/"+that.value).set({lala:[1,2,3]})
        var k = dsrip.encodeURL(that.value);
        dsrip.ref.child("/dataResources/"+k).once('value',function(x){
            //console.log(x.numChildren())
            if(x.numChildren()==0){ // safe to create resource
                dsrip.ref.child("/dataResources/"+k).set({"new field":"rename and populate new field"})
            } else{ // it exists already
                var li = dsrip.byId(k); li.hidden=false
                li.parentNode.insertBefore(li,li.parentNode.firstChild)
                dsrip.editLi(dsrip.byId(that.value))
                //dsrip.byId('edit_'+li.id).click() // edit it
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
    if(typeof(el)=="string"){el=document.getElementById(el)}
    if(el){
    var rmSoon=function(){
       if(el.parentElement){
       el.parentElement.removeChild(el)
       }
    }
    setTimeout(rmSoon,100)
    }
}

dsrip.byId('dsripHeader').innerHTML = '<h3><a href="https://github.com/mathbiol/dsrip" target=_blank>*</a>DSRIP data resources<br><span style="color:green;font-size:12px">logged in as <span id="emailAuth" style="color:blue" onclick="dsrip.email()">'+dsrip.auth.google.email+'</span> <button onclick="dsrip.logout()">logout</button> [<span style="color:blue" id="googleID" onclick="dsrip.googleId()">googleID</span>] <br>at '+Date()+'</span></span></h3>';


}



