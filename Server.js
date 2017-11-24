// Initialisierung des Webservers
const express = require('express');
const app = express();

// body-parser initialisieren
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

// EJS Template Engine initialisieren
app.engine('.ejs', require('ejs').__express);
app.set('view engine', 'ejs');

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

//Sessions setup
const session = require('express-session');
app.use(session({
    secret: 'this-is-a-secret',     //necessary for encoding
    resave: false,                  //should be set to false, except store needs it
    saveUninitialized: false        //same reason as above.
}));

//Funktion für TingoDB update
function update(daten){
	db.collection(DB_COLLECTION).update({"4":daten[0][4]},{"1": daten[0][1], "2": daten[0][2], "3": daten[0][3], "4": daten[0][4], "5": daten[0][5], "6": daten[0][6], "7": daten[0][7], "8": daten[0][8], "9": daten[0][9], "10": daten[0][10], "11": daten[0][11], "12": daten[0][12]}, function (err, result) {
    	console.log(err, result);
    });
 	console.log("Geänderter Datensatz hochgeladen");
}


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
		
		console.log(`Registriert als ${vorname} ${nachname}`);
		
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
				console.log("error: ein feld nicht ausgefüllt:)");
				res.redirect('registrieren');
				break;
			}
			count += 1;
		}
		
		if(fehler == false){
			// Datensatz in Collection speichern
			db.collection(DB_COLLECTION).save(document, function(err, result){
				console.log(result);
				console.log('Datensatz gespeichert, Registrierung war erfolgreich');
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


	
	console.log(`Loginversuch mit ${email} ${password}`);

	
	//Alternative möglichkeit zum finden von Datensätzen
	//Find gibt 2 dimensionales Array zurück und findOne ein eindimensionales 
	/*db.collection(DB_COLLECTION).findOne({"4":email},function(err, result){
		
		...
		
	});*/
	db.collection(DB_COLLECTION).find({"4":email}).toArray(function(err, result){
		
		if(err){
			console.log("anmeldung nicht möglich");
			res.redirect('/login');
		}

		else{
			console.log("gefundenes Passwort" +result[0][12]);
			
			if(passwordHash.verify(password, result[0][12])){
				req.session.authenticated = true;
				req.session['user'] = result[0][1];
				req.session['nach'] = result[0][2];
				req.session['Telefon'] = result[0][3];
				req.session['Email'] = result[0][4];
				req.session['PLZ'] = result[0][5];
				req.session['Ort'] = result[0][6];
				req.session['Straße'] = result[0][7];
				req.session['Hausnummer'] = result[0][8];
				req.session['Tag'] = result[0][9];
				req.session['Monat'] = result[0][10];
				req.session['Jahr'] = result[0][11];
                req.session.daten = result;
				

                console.log("session gestartet");

				console.log("anmeldung erfolgreich");
				res.redirect('/Startseite');
			}

			else{
				console.log("anmeldung fehlgeschlagen");
				res.redirect('/login');
			}
		}
	});
	
});

//Passwort vergessen
app.get('/passwort', function(req, res){
	res.render('passwort');
});

app.post('/passwort', function(req, res){
	
	//Falls Error: set NODE_TLS_REJECT_UNAUTHORIZED=0
	
	var email = req.body['email'];
	'use strict';
	const nodemailer = require('nodemailer');

    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport({
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
			    var mailOptions = {
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

//Passwort zurücksetzen
app.get('/resetyourpasswordnowforcar4you', function(req, res){
	res.render('reset');
});

app.post('/resetyourpasswordnowforcar4you', function(req, res){
	
	var mail = req.body['email'];
	var newpassword= req.body['password'];
	var richtigeemail = false;
	
	if(newpassword !=''){

		db.collection(DB_COLLECTION).find({"4":mail}).toArray(function(err, result){		
		
			if(err){
				console.log(err);
				res.redirect('/resetyourpasswordnowforcar4you');
			}

			else{
				console.log('Passwort zurücksetzen gefundene daten', result);

				var passwort = passwordHash.generate(newpassword);
				result[0][12]= passwort;
				console.log('geänderte daten', result);
				console.log("Passwort neu "+result[0][12]);
    			update(result);
    			res.redirect('/');

			}
		});
	}
});
	
//Logout Seite	
app.get('/logout', function(req, res){
	res.render('logout');
	delete req.session.authenticated;
	delete req.session['user'];
    delete req.session.daten;
});


//eingeloggte Startseite
app.get('/Startseite', function(req, res){
	if (req.session['authenticated'] == true){
		res.render('index', {'user': req.session['user']});
	}
	else{res.redirect('/');
	}
});

//Map API
app.get('/MyMap', function(req, res){
	if (req.session['authenticated'] == true){
		res.render('Maps', {'user': req.session['user']});
	}
	else{res.redirect('/');
	}
});

//Kontakt Seite
app.get('/Kontakt', function(req,res){
	res.render('kontakt');
});

app.post('/Kontakt', function(req,res){
	var email = req.body['E-Mail'];
	var name = req.body['Name'];
	var text = req.body['Text'];
});

//Benutzerverwaltung
app.get('/User', function(req, res){
	
	if (req.session['authenticated'] == true){
		res.render('user', {'user': req.session['user']});
			/*{'nach': req.session['nach']}
			{'Telefon': req.session['Telefon']}
			{'Email': req.session['Email']}
			{'PLZ': req.session['PLZ']}
			{'Ort': req.session['Ort']})
			{'Straße': req.session['Straße']}
			{'Hausnummer': req.session['Hausnummer']}
			{'Tag': req.session['Tag']}
			{'Monat': req.session['Monat']}
			{'Jahr': req.session['Jahr']});*/
		/*('user', {'nach': req.session['nach']})
		('user', {'Telefon': req.session['Telefon']})
		('user', {'Email': req.session['Email']})
		('user', {'PLZ': req.session['PLZ']})
		('user', {'Ort': req.session['Ort']})
		('user', {'Straße': req.session['Straße']})
		('user', {'Hausnummer': req.session['Hausnummer']})
		('user', {'Tag': req.session['Tag']})
		('user', {'Monat': req.session['Monat']})
		('user', {'Jahr': req.session['Jahr']});*/
			res.render('user', {'nach': req.session['nach']});
			res.render('user', {'Telefon': req.session['Telefon']});
			res.render('user', {'Email': req.session['Email']});
			res.render('user', {'PLZ': req.session['PLZ']});
			res.render('user', {'Ort': req.session['Ort']});
			res.render('user', {'Straße': req.session['Straße']});
			res.render('user', {'Hausnummer': req.session['Hausnummer']});
			res.render('user', {'Tag': req.session['Tag']});
			res.render('user', {'Monat': req.session['Monat']});
			res.render('user', {'Jahr': req.session['Jahr']});
	}
	else{res.redirect('/');
	}
});