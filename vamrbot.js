//запускать token=xoxb-174517640498-myyDhcMiXxvF4XSlPuYzHxg7 node vamrbot.js

var Botkit = require('./lib/Botkit.js'),
  mongoStorage = require('botkit-storage-mongo')({mongoUri: 'mongodb://localhost/vamrbot', tables: ['anketa']}),
  controller = Botkit.slackbot({
  debug: false,
  storage: mongoStorage
});





if (!process.env.token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}


controller.spawn({
  token: process.env.token
}).startRTM(function(err) {
  if (err) {
    throw new Error(err);
  }
});




//Записать всех пользователей команды и их slack profile в коллекцию users в БД
//Использовать только один раз, перед отправкой всем анкеты, новые пользователи
//будут автоматически добавлены в БД!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
controller.hears(['!!!allUsersToDb'],['direct_message'],function(bot,message) {
    
    console.log(typeof message.user);
    console.log(message.user);
    //Сюда написать uid Админа от которого будет послана команда.
    if (message.user === 'U2Z2T4WN9'){ 
    bot.api.users.list({},function(err,response) {
    
    var memberlist = response.members;
    for (i in memberlist){
      console.log("ETO " + i + " POLZOVATEL " + memberlist[i].id);

      var userinfo = {id: memberlist[i].id, profile: memberlist[i].profile, likesNum:0, likesQuality:0, responseNum:0, msgNum:0, anketaFilled:false};
      controller.storage.users.save(userinfo);

    }
    bot.reply(message,"Slack данные для всех пользователей обновлены и записаны в базу. Больше эту команду использовать *НЕ* надо!!! Новые пользователи будут автоматически добавлены в БД");
    });
  }else{
    bot.startPrivateConversation({user: message.user}, function(response,convo){
    convo.say("Я вас не понимаю.");
    convo.next();  
    });
  }

});

//Перед отправлением анкеты надо ОБЯЗАТЕЛЬНО послать боту команду !!!allUsersToDb
controller.hears(['anketaAll'],['direct_message'],function(bot,message) {
    
    
    //Сюда написать uid Админа
    if (message.user === 'U2Z2T4WN9'){ 
    bot.api.users.list({},function(err,response) {
    
    var memberlist = [response.members];
    memberlist = JSON.stringify(memberlist);

    var result = memberlist.substring(1, memberlist.length-1);
    result = JSON.parse(result);
    
    for (var i = 0; i <= result.length-1; i++){
            
            console.log(result[i].id + "TYPEOF");
            console.log(typeof result[i].id);
            console.log(result[i].is_bot);



            //проверка является ли пользователь ботом или deleted или restricted
            //setTimeout используется, что бы слак не забанил бота за спам
            if (result[i].is_bot === false && result[i].deleted === false && result[i].is_restricted === false && result[i].is_ultra_restricted === false){
            
            setTimeout(function(x) { return function() { bot.startPrivateConversation({user: x}, Que0); }; }(result[i].id), 1300*i);  
            
            }  




        }

    bot.reply(message,"Анкета отправлена.");
    });
  }else{
    bot.startPrivateConversation({user: message.user}, function(response,convo){
    convo.say("Я вас не понимаю.");
    convo.next();  
    });
  }

});

//сохранение данных нового пользователя при подключение к команде
//вывод общей инфы о команде и начало анкетирования
controller.on('team_join',function(bot,message) {
    var msgg = JSON.stringify(message);
    console.log("POLZOVATEL PODKLU$ILSA " + msgg);

    var userInfo = {id: message.user.id, profile: message.user.profile};
    controller.storage.users.save(userInfo);

    
    
    bot.startPrivateConversation({user: message.user.id}, NewUser);
});






//Начать анкетирование пользователя по запросу
controller.hears(['!анкета'],['direct_message'],function(bot,message) {
    
        var sada = JSON.stringify(message.user);
        var sent = {id: sada};
        console.log(controller.storage.users.find());
        
        bot.startConversation(message, Que0);

    
});


//Этапы анкетирования
NewUser = function(response, convo) {
     
    convo.say("Приветствуем вас в группе VAMR! Я-бот группы. Вот, какие каналы у нас есть: \n\n Общий канал VAMR <#C0E9MJLMR|general> для важных сообщений, общих вопросов и анонсов. \nКаналы по теме VR: <#C0EH47H8F|vr>, <#C0EHRF9SS|vr_news>. \nКаналы по теме AR: <#C0EH3T947|ar>, <#C0EHMFXB7|ar_news>. \nКаналы по теме MR и смежных технологий: <#C0EH4TTR8|mr>, <#C0EHQ1PV3|mr_news>. \nКанал о мероприятиях по технологиям AR&VR&MR: <#C0GBW02QP|events> \nКанал для вывешивания вакансий и поиска работы <#C0GCZGSAU|job> \nКанал для купли / продажи <#C0LV0GQ1J|baraholka> \nКанал для обсуждения всех технических вопросов <#C278EDBV5|tech-faq> \n\n А теперь предлагаю вам перейти в канал <#C0E9MJLMR|general> и поздороваться с остальными участниками! :)\n\n\n\n");
    Que0(response, convo);
    convo.next();
  
}


Que0 = function(response, convo) {
  console.log(response);

  
  convo.ask("Здравствуйте, VAMR-бот на связи! Эта анкета поможет нашему с вами сообществу получать аналитические данные, доступные только ответившим на вопросы пользователям, а также в дальнейшем получать массу другой полезной информации. Всего будет задано 8 вопросов. Поехали?\nОтветьте *да* или *нет*", function(response, convo) {
    
    var answer = response.text;
    answer = answer.toLowerCase();
    
    if(answer === 'да') {
      convo.say("Отлично, продолжаем.");
      UserName(response, convo);
      convo.next();
    }else if(answer === 'нет'){
      
      convo.say("Спасибо за проявленный интерес к жизни сообщества!");
      convo.next();
    }else{
      convo.say("*Я не понял ваш ответ. Пожалуйста ответьте еще раз на данный вопрос.*")
      Que0(response, convo);
      convo.next();
    }
  });
  
}


UserName = function(response, convo) {
  convo.ask("1. Как вас зовут? Имя, Фамилия.", function(response, convo) {
    var arr = "";
    arr = arr + "{id: " + response.user + ",";
    var saveAnswer = {id: response.user, name: response.text};
    //ЗАпись имени пользователя
    controller.storage.anketa.save(saveAnswer);
   
    convo.say("Отлично, продолжаем.");
    UserEmail(response, convo);
    convo.next();
  });
}


UserEmail = function(response, convo) { 
  convo.ask("2. Ваш email?", function(response, convo) {
    var otvet = response.text;
    var proverkaEmail = otvet.indexOf("@");

    if (proverkaEmail >= 0 ){
      controller.storage.anketa.get(response.user, function(error, user){

     var vstroky = JSON.stringify(user);
     vstroky = vstroky.substring(0, vstroky.length - 1);
     vstroky = vstroky +",\"email\":" + "\"" + response.text + "\"}"; 
     
     vstroky = JSON.parse(vstroky);
     controller.storage.anketa.save(vstroky);

     
    convo.say("Отлично, продолжаем.");
    UserPhone(response, convo);
    convo.next();
    });
    }else{
      convo.say("*Похоже вы ввели не email.*");
    UserEmail(response, convo);
    
    convo.next();
    }
  });
}

UserPhone = function(response, convo) { 
  convo.ask("3. Ваш телефон?", function(response, convo) {
    controller.storage.anketa.get(response.user, function(error, user){
     var vstroky = JSON.stringify(user);
     vstroky = vstroky.substring(0, vstroky.length - 1);
     vstroky = vstroky +",\"phone\":" + "\"" + response.text + "\"}"; 
     
     vstroky = JSON.parse(vstroky);
     controller.storage.anketa.save(vstroky);

    });


    
    convo.say("Отлично, продолжаем.");
    UserCity(response, convo);
    convo.next();
  });
}

UserCity = function(response, convo) { 
  convo.ask("4. Из какого вы города?", function(response, convo) {
    controller.storage.anketa.get(response.user, function(error, user){
     var vstroky = JSON.stringify(user);
     vstroky = vstroky.substring(0, vstroky.length - 1);
     vstroky = vstroky +",\"city\":" + "\"" + response.text + "\"}"; 
     
     vstroky = JSON.parse(vstroky);
     controller.storage.anketa.save(vstroky);

    });


    convo.say("Отлично, продолжаем.");
    MainProjects(response, convo);
    convo.next();
  });
}


MainProjects = function(response, convo) {
  convo.ask("5. Какие ваши основные достижения/проекты?", function(response, convo) {
    
     controller.storage.anketa.get(response.user, function(error, user){
     var vstroky = JSON.stringify(user);
     vstroky = vstroky.substring(0, vstroky.length - 1);
     vstroky = vstroky +",\"mainProjects\":" + "\"" + response.text + "\"}"; 
     
     vstroky = JSON.parse(vstroky);
     controller.storage.anketa.save(vstroky);

    });

    convo.say("Отлично, продолжаем.");
    CompanyName(response, convo);
    convo.next();
  });
}


CompanyName = function(response, convo) {
  convo.ask("6. Название вашей компании?", function(response, convo) {
    
     controller.storage.anketa.get(response.user, function(error, user){
     var vstroky = JSON.stringify(user);
     vstroky = vstroky.substring(0, vstroky.length - 1);
     vstroky = vstroky +",\"companyName\":" + "\"" + response.text + "\"}"; 
     
     vstroky = JSON.parse(vstroky);
     controller.storage.anketa.save(vstroky);

    });

    convo.say("Отлично, продолжаем.");
    CompanyPosition(response, convo);
    convo.next();
  });
}

CompanyPosition = function(response, convo) {
  convo.ask("7. Ваша должность в компании?", function(response, convo) {
    
     controller.storage.anketa.get(response.user, function(error, user){
     var vstroky = JSON.stringify(user);
     vstroky = vstroky.substring(0, vstroky.length - 1);
     vstroky = vstroky +",\"companyPosition\":" + "\"" + response.text + "\"}"; 
     
     vstroky = JSON.parse(vstroky);
     controller.storage.anketa.save(vstroky);

    });

    convo.say("Отлично, продолжаем.");
    CompanySite(response, convo);
    convo.next();
  });
}


CompanySite = function(response, convo) {
  convo.ask("8. Сайт вашей компании?", function(response, convo) {
    
     controller.storage.anketa.get(response.user, function(error, user){
     var vstroky = JSON.stringify(user);
     vstroky = vstroky.substring(0, vstroky.length - 1);
     vstroky = vstroky +",\"companySite\":" + "\"" + response.text + "\"}"; 
     
     vstroky = JSON.parse(vstroky);
     controller.storage.anketa.save(vstroky);

    });

    
    FinishAnketa(response, convo);
    convo.next();
  });
}






FinishAnketa = function(response, convo) { 
  console.log("FINISH" + JSON.stringify(response));
  
    controller.storage.users.get(response.user, function(error, user){
      // var userFromDb = user;
      // userFromDb.anketaFilled = true;
      // delete userFromDb['_id'];
      // var str = JSON.stringify(userFromDb);

     var vstroky = JSON.stringify(user);
     vstroky = vstroky.substring(0, vstroky.length - 1);
     vstroky = vstroky +",\"anketaFilled\":" + true + "}"; 
     
     vstroky = JSON.parse(vstroky);
    
     controller.storage.users.save(vstroky);

    });


    
    convo.say("Спасибо большое за заполнение анкеты!");
    convo.next();
  
}