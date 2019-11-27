# NUGUMATE: NUGU speaker empathizes with your feelings 

 Both demands for AI speaker and people who regard AI speakers as an interlocutor are increasing. For these reasons, the demand for the service that AI speakers can provide comfort is increasing.
 
A user keeps a journal in the application, sends it to the server(web server), and the server sends the journal to the sentiment analysis model linked with another server(the model server) to classify the emotions of the journal into positive or negative. Then the model server gets the result from the model and sends it to the web server so that the web server can save user information, the contents of the journal and the result of sentiment analysis model to the database.  

After that, when the user starts a daily conversation with the NUGU device, such as "Aria, how was your day?", then it requests a proper answer to the server and the server gives the answer to the speaker based on the result of the model that is saved in the database, such as “I was depressed because you looked depressed”, and the speaker answers it to the user.

## You can also see...
  - Our latest description of this project : https://www.overleaf.com/read/mgsvwfwgvqjb
  - App used in this project : https://github.com/cngjsskaisme/NUGUMate  
  - Model used in this project : https://github.com/hyun1014/NUGUMATE_Model  
  - Korean Version of this README : https://github.com/cngjsskaisme/NUGUMate/blob/master/README_ko.md
