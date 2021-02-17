const app = require('express');
const server = app();
const fs = require('fs');
const bodyParser = require("body-parser");
const http = require('http').createServer(server);
const io = require('socket.io')(http);

var id = 0;
var panelId = 0;
var ids = [];
var widgets = [];
var storie = [];
var punteggi = [];
var storiepubblicate = [];
server.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
}));

server.use(bodyParser.json());
server.use(app.static(__dirname));

io.on('connect', function(socket) {
  socket.on('panelStart', (data)=> {
    console.log("Pannello creato con id "+ data);
    panelId = data;
    socket.join(data);
  });
  socket.on('panelDisconnected', (data) => {
    console.log("Pannello " + data + " resettato");
    socket.leave(data);
  });
  socket.on('userConnected', (data)=>{
    console.log("Utente entrato nella stanza "+ data);
    ids.push(data);
    socket.join(data);
    message(panelId,"getUser",{ids});
    console.log(ids);
  });
  socket.on('chiediaiuto',(data)=>{
    message(panelId,"help",data);
  })
  socket.on('userDisconnected', (data)=>{

    console.log("Utente uscito dalla stanza "+ data);
    let index = ids.indexOf(data);
    ids.splice(index, 1);
    socket.leave(data);
    if(ids.length){
    } else {
      id = 0;
    }
    message(panelId,"getUser",{ids});
    console.log(ids);
  });
  socket.on("getPanelRooms", (data) =>{
      socket.join("stanza"+data);
  });
  socket.on("getPanelUsers", (data) =>{
      socket.join(data);
  });
  socket.on("getPanelClasse", (data) =>{
      socket.join(data);
  });
  socket.on("getRoom", (data) =>{
      socket.leave(data.id);
      let index = ids.indexOf(data.id);
      ids.splice(index, 1);
      socket.join(data.room);
      ids.push(data.room);
    });
  socket.on("msg", (data)=>{
    message(data.id,"message",{id: data.id, user: data.user, msg: data.msg});
  });
  socket.on("assegnaNome",(data)=>{
    message(data.id,"setNome",{id: data.id, nome: data.nome})
  })
  socket.on('aiuta',(data)=>{
    message(data.id,"riceviAiuto",data.indizio);
  });
  socket.on("chiedivalutazione",(data)=>{
    message(panelId,"chiedivalutazione",data);
  });
  socket.on("valuta", (data)=>{
    message(data.id,"riceviValutazione",{valutazione: data.valutazione, punteggio: data.punteggio});
  });
  socket.on("sendlunghezza", (data)=>{
    message(panelId,"getLunghezza",data);
  });
  socket.on("rispostaErrata",(data)=>{
    message(data,"errorerisposta","OK");
  });
  socket.on("rispostaCorretta", (data)=>{
    message(data.id,"prosegui",data.value);
  });
  socket.on("sendStatus",(data)=>{
    message(panelId,"getStatus",data);
  });
});

function message(userId, event, data) {
  io.sockets.to(userId).emit(event, data);
}
server.post('/pubblica',function(req,res){
  let id = req.body.id
  if(storiepubblicate.length > 0){
    let check = true;
    for(let i in storiepubblicate){
      if(storiepubblicate[i].id == id ){
        check = false;
        break;
      }
    }
    if(check){
      storiepubblicate.push(req.body);
      fs.writeFile(__dirname+"/pages/pubblicate.json", JSON.stringify(storiepubblicate), function(err, result) {
        if(err) console.log('errore nel salvataggio del pubblicate.json', err);
      });
      res.send("OK");
    } else {
      res.send("Error");
    }

  } else {
    if (fs.existsSync(__dirname+"/pages/pubblicate.json")) {
      let obj = fs.readFileSync(__dirname + '/pages/pubblicate.json', 'utf8');
      storiepubblicate = JSON.parse(obj);
      let check = true;
      for(let i in storiepubblicate){
        if(storiepubblicate[i].id == id ){
          check = false;
          break;
        }
      }
      if(check){
        storiepubblicate.push(req.body);
        fs.writeFile(__dirname+"/pages/pubblicate.json", JSON.stringify(storiepubblicate), function(err, result) {
          if(err) console.log('errore nel salvataggio del pubblicate.json', err);

        });
        res.send("OK");
      } else {
        res.send("Error");
      }
    } else {
      let check = true;
      for(let i in storiepubblicate){
        if(storiepubblicate[i].id == id ){
          check = false;
          break;
        }
      }
      if(check){
        storiepubblicate.push(req.body);
        fs.writeFile(__dirname+"/pages/pubblicate.json", JSON.stringify(storiepubblicate), function(err, result) {
          if(err) console.log('errore nel salvataggio del pubblicate.json', err);

        });
        res.send("OK");
      } else {
        res.send("Error");
      }
    }
  }

});
server.post('/ritira',function(req,res){
  let id = req.body.id;
  let check = false;
  for(let i in storiepubblicate){
    if(storiepubblicate[i].id == id ){
      storiepubblicate.splice(i,1);
      check = true;
      break;
    }
  }
  if(check){
    if(storiepubblicate.length == 0){
      fs.unlink(__dirname+"/pages/pubblicate.json", (err) => {
        if (err) {
          console.error(err)
        }
      });
    } else {
      fs.writeFile(__dirname+ "/pages/storiepubblicate.json", JSON.stringify(storiepubblicate), function(err, result) {
        if(err) console.log('errore nel salvataggio del file pubblicate.json', err);
      });
    }
    res.send("OK");
  } else {
    res.send("Error");
  }

});
server.get('/caricapubblicate',function(req,res){
  if(storiepubblicate.length > 0){
    res.send(storiepubblicate);
  } else {
    if (fs.existsSync(__dirname+"/pages/pubblicate.json")) {
      let obj = fs.readFileSync(__dirname + '/pages/pubblicate.json', 'utf8');
      storiepubblicate = JSON.parse(obj);
      res.send(storiepubblicate);
    } else {
      res.send("Error");
    }
  }
});
server.get('/getid', function(req, res) {
  id = id+1;
  res.send(""+id);
});
server.post('/customcss',function(req,res){
  let nome = req.body.nome
  console.log(nome);
  console.log(fs.existsSync(nome+".css"));
  if (fs.existsSync(nome+".css")) {
    res.send("OK")
  } else {
    res.send("Error");
  }
});
server.post('/getcustomcss',function(req,res){
  let nome = storie[req.body.index].id
  console.log(nome);
  if (fs.existsSync(nome+".css")) {
    let css = fs.readFileSync(nome+'.css', 'utf8');
    res.send(css);
  } else {
    res.send("Error");
  }
});
server.post('/savecustomcss',function(req,res){
  let nome = storie[req.body.index].id
  console.log(nome);
  let css = req.body.css
  fs.writeFile(nome+".css", css, function(err, result) {
    if(err) console.log('errore nel salvataggio del file css', err);
  });
  res.send("OK")
});
server.post('/deletecustomcss',function(req,res){
  let nome = req.body.index;
  if (fs.existsSync(nome+".css")) {
    fs.unlink(nome+".css", (err) => {
      if (err) {
        console.error(err)
      }
    });
    res.send("OK")
  } else {
    res.send("Error");
  }
});
server.post('/finestoria',function(req,res){
  let nome = req.body.nome;
  if(nome == "") nome = req.body.stanza;
  if(punteggi.length){
    for(let i in punteggi){
      if(i == req.body.storia){
          punteggi[i][req.body.storia].push({utente: nome, punteggio: req.body.punteggio})
          break;
      }
    }
    fs.writeFile(__dirname+"/pages/scores.json", JSON.stringify(punteggi), function(err, result) {
      if(err) console.log('errore nel salvataggio del file scores.json', err);
    });
  } else {
    if (fs.existsSync(__dirname+"/pages/scores.json")) {
      let obj = fs.readFileSync(__dirname + '/pages/scores.json', 'utf8');
      punteggi = JSON.parse(obj);
      for(let i in punteggi){
        if(i == req.body.storia){
            punteggi[i][req.body.storia].push({utente: nome, punteggio: req.body.punteggio})
            break;
        }
      }

      fs.writeFile(__dirname+"/pages/scores.json", JSON.stringify(punteggi), function(err, result) {
        if(err) console.log('errore nel salvataggio del file scores.json', err);
      });
    } else {
      let string = {}
      console.log(req.body);
      string[req.body.storia] = []
      string[req.body.storia].push({utente: nome, punteggio: req.body.punteggio})
      punteggi.push(string)
      fs.writeFile(__dirname+"/pages/scores.json", JSON.stringify(punteggi), function(err, result) {
        if(err) console.log('errore nel salvataggio del file scores.json', err);
      });
    }
  }
  message(panelId,"sendPunteggio",{utente: req.body.stanza, nome: nome, punteggio: req.body.punteggio});
  res.send("OK");
});
server.post('/iniziaStoria', function(req,res){
  let tipo = req.body.type;
  let numero = parseInt(req.body.n);
  if(tipo == "classe"){
    if(ids.length == 0){
      res.send("Error");
    } else {
      for(let i = 0; i < ids.length; i++){
        message(ids[i],"room",{tipo: tipo, stanza: "stanza"});
      }
      res.send("OK")
    }
  }
  if(tipo == "gruppo"){
    let c = 0;
    let nstanza = 1;
    if(ids.length == 0){
      res.send("Error");
    } else {
      for(let i = 0; i < ids.length; i++){
        if(c >= numero){
          c = 0;
          nstanza = nstanza + 1;
        }
        c = c + 1;
        message(ids[i],"room",{tipo: tipo, stanza: "stanza"+nstanza});
      }
      res.send(""+nstanza);
    }

  }
  if(tipo == "individuale"){
    for(let i = 0; i < ids.length; i++){
      message(ids[i],"room",{tipo: tipo, stanza: ids[i]});
    }
    res.send(""+ids.length);
  }
});
server.post('/salvawidget', function(req, res) {
  try {
    let name = req.body.name
    let items = req.body.items
    let string = {}
    string[name] = items
    var check = true
    if (widgets.length > 0) {
      for (let i = 0; i < widgets.length;i++){
        if(widgets[i].hasOwnProperty(name)){
          check = false
          break;
        }
      }
      if (check) {
        widgets.push(string);
        fs.writeFile(__dirname+"/pages/mywidgets.json", JSON.stringify(widgets), function(err, result) {
          if(err) console.log('errore nel salvataggio del file mywidgets.json', err);
        });
        res.send("OK");
      } else {
        res.send("Error");
      }
    } else {
      widgets.push(string);
      fs.writeFile(__dirname+"/pages/mywidgets.json", JSON.stringify(widgets), function(err, result) {
        if(err) console.log('errore nel salvataggio del file mywidgets.json', err);

      });
      res.send("OK");
    }
  } catch (error) {console.log(error);}

});

server.get('/caricawidget', function(req, res) {
  if(widgets.length > 0){
    res.send(JSON.stringify(widgets));
  } else {
    if (fs.existsSync(__dirname+"/pages/mywidgets.json")) {
      var obj = fs.readFileSync(__dirname+'/pages/mywidgets.json', 'utf8');
      console.log(obj);
      widgets = JSON.parse(obj);
      res.send(obj);
    } else {
      res.send("error");
    }
  }

});
server.post('/riordina',function(req,res){
  let idstoria = req.body.idstoria
  let ordine = req.body.ordine
  let nuovoarray = []
  for(let i=0; i < storie[idstoria].elementi.length; i++){
    nuovoarray[i] = storie[idstoria].elementi[ordine[i]];
  }
  console.log(nuovoarray);
  storie[idstoria].elementi = nuovoarray;
  fs.writeFile(__dirname+ "/pages/storie.json", JSON.stringify(storie), function(err, result) {
    if(err) console.log('errore nel salvataggio del file storie.json', err);
  });
  res.send("OK");
});
server.post('/eliminastoria', function(req, res) {
  let id = req.body.number;
  for(let i in storie){
    if(storie[i].id == id ){
      storie.splice(i,1);
      break;
    }
  }
  if(storie.length == 0){
    fs.unlink(__dirname+"/pages/storie.json", (err) => {
      if (err) {
        console.error(err)
      }
    });
  } else {
    fs.writeFile(__dirname+ "/pages/storie.json", JSON.stringify(storie), function(err, result) {
      if(err) console.log('errore nel salvataggio del file storie.json', err);
    });
  }
  res.send("OK");
});
server.post('/modificastoria', function(req, res) {
  let id = req.body.number;
  for(let i in storie){
    if(storie[i].id == id){
      storie[i].titolo = req.body.titolo;
      storie[i].accessibile = req.body.accessibile;
      storie[i].fascia = req.body.fascia;
      break;
    }
  }
  fs.writeFile(__dirname + "/pages/storie.json", JSON.stringify(storie), function(err, result) {
    if(err) console.log('errore nel salvataggio del file storie.json', err);
  });
  res.send("OK");
});

server.post('/eliminaSchermata', function(req, res) {
  let idstoria = req.body.idstoria;
  let idschermata = req.body.idschermata;
  storie[idstoria].elementi.splice(idschermata,1);

  fs.writeFile(__dirname+ "/pages/storie.json", JSON.stringify(storie), function(err, result) {
    if(err) console.log('errore nel salvataggio del file storie.json', err);
  });
  res.send("OK");
});

server.post('/duplicastoria', function(req, res) {
  let id = req.body.number;
  for(let i in storie){
    if(storie[i].id == id){
      let nuova = JSON.parse(JSON.stringify(storie[i]))
      nuova.id = storie[storie.length-1].id +1
      storie.push(nuova)
      console.log(storie[i])
      console.log(storie[storie.length-1])
      break;
    }
  }

  fs.writeFile(__dirname + "/pages/storie.json", JSON.stringify(storie), function(err, result) {
    if(err) console.log('errore nel salvataggio del file storie.json', err);
  });
  res.send("" + storie[storie.length-1].id);
});

server.post('/aggiornastoria', function(req,res) {
  if(storie.length == 0){
    storie = JSON.parse(fs.readFileSync(__dirname + '/pages/storie.json', 'utf8'));
  }
  let number = parseInt(req.body.number)
  let schermate = req.body.schermate
  console.log(schermate);
  storie[number].elementi.push(schermate)
  fs.writeFile(__dirname + "/pages/storie.json", JSON.stringify(storie), function(err, result) {
    if(err) console.log('errore nel salvataggio del file storie.json', err);
  });
  res.send("OK");
});

server.get('/caricastorie', function(req, res) {
  if(storie.length > 0){
    res.send(JSON.stringify(storie));
  } else {
    if (fs.existsSync(__dirname + "/pages/storie.json")) {
      let obj = fs.readFileSync(__dirname + '/pages/storie.json', 'utf8');
      storie = JSON.parse(obj);
      console.log(storie);
      res.send(obj);
    } else {
      res.send("error");
    }
  }

});

server.post('/salvastoria', function(req, res) {
  let storia = req.body;
  storia["elementi"] = []
  console.log(req.body);
  if(storie.length > 0){
    storia["id"] = storie[storie.length-1].id +1;
    storie.push(storia);
    fs.writeFile(__dirname+ "/pages/storie.json", JSON.stringify(storie), function(err, result) {
      if(err) console.log('errore nel salvataggio del file storie.json', err);
    });

  } else {
    storia["id"] = 0;
    storie.push(storia);
    fs.writeFile(__dirname+ "/pages/storie.json", JSON.stringify(storie), function(err, result) {
      if(err) console.log('errore nel salvataggio del file storie.json', err);

    });
  }
  res.send("" + storia["id"]);
});
server.get("/player", function(req, res) {
  res.sendFile(__dirname + "/pages/player.html");
});
server.get("/author", function(req, res) {
  res.sendFile(__dirname + "/pages/author.html");
});

server.get("/editor/crea", function(req, res) {
  res.sendFile(__dirname + "/pages/editor/crea.html");
});

server.get("/editor/storie", function(req, res) {
  res.sendFile(__dirname + "/pages/editor/storie.html");
});

server.get("/editor/widget", function(req, res) {
  res.sendFile(__dirname + "/pages/editor/widget.html");
});

server.get("/editor", function(req, res) {
  res.sendFile(__dirname + "/pages/editor/storie.html");
});

server.get("/", function(req, res) {
  res.sendFile(__dirname + "/pages/home.html");
});
http.listen(8000, (err) => {
  if (err) throw err
  console.log('Running')
})
