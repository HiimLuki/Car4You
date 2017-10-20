// Initialisierung des Webservers
const express = require('express');
const app = express();

// body-parser initialisieren
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

// EJS Template Engine initialisieren
app.engine('.ejs', require('ejs').__express);
app.set('view engine', 'ejs');

// Sessions initialisieren
const session = require('express-session');
app.use(session({ 
	secret: 'example',
	resave: false,
	saveUninitialized: true
}));

//Name der Collection
var DB_COLLECTION = "products";

//Datenbank TingoDB
require('fs').mkdir(__dirname + '/tingodb', (err)=>{});
const Db = require('tingodb')().Db;
const db = new Db(__dirname + '/tingodb', {});
const ObjectID = require('tingodb')().ObjectID;

//password hash, for encoding the pw
const passwordHash = require('password-hash');

// Webserver starten
// Aufruf im Browser: http://localhost:3000
app.listen(3000, function(){
	console.log("listening on 3000");
});						

//Dateien Laden
app.use(express.static('car4you'));	

//Registrieren
app.get('/registrieren', function(req, res){
	res.render('registrieren');
});

app.post('/registrieren', function(req,res){
		const vorname = req.body['Vorname'];
		const nachname = req.body['Nachname'];
		const telefon = req.body['Telefonnummer'];
		const mail = req.body['E-Mail'];
		const plz = req.body['Postleitzahl'];
		const wohnort = req.body['Wohnort'];
		const straße = req.body['Straße'];
		const hausnummer = req.body['Hausnummer'];
		const tag = req.body['Tag'];
		const monat = req.body['Monat'];
		const jahr = req.body['Jahr'];
		const password = req.body['Passwort'];
		const encryptedPassword = passwordHash.generate(password);
		
		console.log(`Registriert ${vorname} ${nachname}`);
		
		//Beispieldatensatz, der gespeichert wird
		var document = {	'1': vorname,
							'2': nachname,
							'3': telefon,
							'4': mail, 
							'5': plz,
							'6': wohnort,
							'7': straße, 
							'8': hausnummer,
							'9': tag,
							'10': monat, 
							'11': jahr,
							'12': encryptedPassword,
						};
							
		var fehler = false;
		var count = 1;
		for(x in document){
			if(document[count] == ""){
				fehler = true;
				console.log("error :)");
				res.redirect('registrieren');
				break;
			}
			count += 1;
		}
		
		if(fehler == false){
			// Datensatz in Collection speichern
			db.collection(DB_COLLECTION).save(document, function(err, result){
				console.log(result);
				console.log('Datensatz gespeichert');
				res.redirect('/');
			});
		}
});

//Login
app.get('/login', function(req, res){
	res.render('login');
});

app.post('/login', function(req, res){
	
	var email = req.body['username'];
	var password= req.body['password'];
	
	console.log(`Login ${email} ${password}`);
	//passwordHash.verify(password, result...)

	/*db.collection(DB_COLLECTION).findOne({"4":email},function(err, result){
		console.log("alles " +result["_id"]);
		console.log(" hier "+result[3]);
		var id = result[3];
		
		console.log(id);
		db.collection(DB_COLLECTION).find({"_id":id}).toArray(function(err, result){
			console.log(result);
			console.log(passwordHash.verify(password, result[12]));
			console.log('angemeldet');
		});
	});*/
	db.collection(DB_COLLECTION).find({"4":email}).toArray(function(err, result){
		console.log("alles " +result[0]["_id"]);
		var id = result[0]["_id"];
		
		console.log(id);
		db.collection(DB_COLLECTION).find({"_id":id}).toArray(function(err, result){
			console.log("passswort " + result[0][12]);
			console.log(passwordHash.verify(password, result[0][12]));
			//console.log('angemeldet');
		});
	});
	
});

app.get('/passwort', function(req, res){
	res.render('passwort');
});

app.post('/passwort', function(req, res){
	
	//Falls Error: set NODE_TLS_REJECT_UNAUTHORIZED=0
	
	var email = req.body['email'];
	'use strict';
	const nodemailer = require('nodemailer');

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: 'carforhaw@gmail.com',
            pass: 'zuckerwatte' 
        }
    });
    db.collection(DB_COLLECTION).find().toArray(function(err, result) {

	    var counter = 0;
	    var richtigemail = false;
	    for(x in result){
			
			if(email == result[counter][4]){
				richtigemail= true;
			    // setup email data with unicode symbols
			    let mailOptions = {
			        from: '"Car4You" <carforhaw@gmail.com>', // sender address
			        to: (email), // list of receivers
			        subject: 'Passwort vergessen ✔', // Subject line
			        //text: 'Haben sie ihr Passwort vergessen? Klicken sie auf den Link um ihr Passwort zu ändern! http://localhost:3000/resetyourpasswordnowforcar4you', // plain text body
			        html: '<p><b>Haben sie ihr Passwort vergessen?</b></p>' +
						  '<p>Klicken sie auf den Link um ihr Passwort zu ändern!</p>' +
						  '<p>http://localhost:3000/resetyourpasswordnowforcar4you</p>' // html body
			    };

			    // send mail with defined transport object
			    transporter.sendMail(mailOptions, (error, info) => {
			        if (error) {
			            return console.log(error);
			        }
			        console.log('Message sent: %s', info.messageId);
					res.redirect('/');
			    });
			    break;
			}
			counter +=1;
		}
		if(richtigemail == false){
			console.log('email adresse nicht gefunden');
			res.redirect('passwort');
		}
	});
});

app.get('/resetyourpasswordnowforcar4you', function(req, res){
	res.render('reset');
});

app.post('/resetyourpasswordnowforcar4you', function(req, res){
	
	var mail = req.body['email'];
	var newpassword= req.body['password'];
	var richtigeemail = false;
	
	if(newpassword !=''){

		//console.log(`PW: ${mail} ${newpassword}`);
		
		db.collection(DB_COLLECTION).find().toArray(function(err, result) {
				
			var counter =0;
			for(x in result){
				if(mail == result[counter][4]){
					result[counter][12] = newpassword;
					//console.log(result[counter][12]);
					richtigeemail=true;
						
					res.redirect('/');	
					break;				
				}
				
				counter +=1;
			}

			if(richtigeemail== true){
				var passwort = passwordHash.generate(newpassword)
				console.log("Passwort neu "+passwort);
				db.collection(DB_COLLECTION).update({"4":mail},{"12": passwort, "4": mail}, function (err, result) {
    				console.log(err, result);
    			});
			}	

			if(richtigeemail == false){
				console.log('Falsche emailadresse');
				res.redirect('/resetyourpasswordnowforcar4you');
			}
		});
	}
	else{
		console.log('sie haben kein Passwort eingegeben');
		res.redirect('/resetyourpasswordnowforcar4you');
	}
});
	
	
app.get('/logout', function(req, res){
	res.render('logout');
});

app.post('/logout', function(req, res){
	
});