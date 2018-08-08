## MEAN Angular 6 Login Authentication & Blog Posting Application
### Authentication
This project consists of complete login authentication(verification through email + activation link) which is 100% working. You can signup, signin and the account is registered in a mongoDB collection and verification email will be received in your account. Forgot Password, forgot username, Resend activation link has also included in this project. When a user is registered, by defalut "user" permission is granted to it. Complete validation has been implemented on server side and client side.
### Blog Posting
Users can create a blog/post and share with all the users, other users can like/dislike/post comment to the blog post and share their feelings with each other.The project is still ongoing, but till so far, this application is bug free and working perfectly.
### Technologies Used
1. MongoDB
2. Express
3. Angular 6
4. NodeJS
#### Other library used:
1. Bootstrap 3.3.7
2. Angular2-jwt
3. Bcrypt
4. Validator
5. Nodemon 1.17.5
### Current Softwares
Application is currently running on the following softwares

- Node v9.0.1
- MongoDB 3.4.10
- Git 2.16.2
### Run
All packages are available on this project, you dont need to install the packages, all you need is MongoDB Node.js Nodemon installed to run project.

1. Open cmd and type mongod --dbpath C:\mongodata and press enter.
2. Go to the project meanStackAngular4 folder, open git terminal and type command nodemon index.js and press enter.
3. Project will be successfully running on port 8080 The server will auto restart on changes, due to nodemon.
### Note
Please go to the router>>authentication.js file and add your own gmail address and secret password, otherwise you will not receive any email.
### How to use
You can create an account in the signup page, then verify your account using activation link sent to your email address. The accounts are registered in a mongoDB collection (mean-angular2-authentication). An account requires email and password. The password is crypted in the collection.

If you are logged, the private page which is profile page show you your email and username.
### Contributers
Momin Shahzad
### License
No License
