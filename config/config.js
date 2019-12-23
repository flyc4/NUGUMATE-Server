
/*
 * 설정. DB URL 정의
 */

require('dotenv').config()

module.exports = {
	server_port: 3000,
	db_url: process.env.db_url,
	db_schemas: [
        {file:'./user_schema', collection:'users', schemaName:'UserSchema', modelName:'UserModel'}, 
        {file:'./diary_schema', collection:'diaries', schemaName:'DiarySchema', modelName:'DiaryModel'},  
        {file:'./nuguname_schema', collection:'nugunames', schemaName:'NuguNameSchema', modelName:'NuguNameModel'},
        ],
	route_info: [
        
        //diary 관련 패스들
        {file:'./diary', path:'/Diary/Search_Monthly_Diary', method:'Search_Monthly_Diary', type:'get'}
        ,{file:'./diary', path:'/Diary/Search_Daily_Diary', method:'Search_Daily_Diary', type:'get'}
        ,{file:'./diary', path:'/Diary/Save_Daily_Diary', method:'Save_Diary', type:'post'}
        ,{file:'./diary', path:'/Diary/Delete_Daily_Diary', method:'Delete_Diary', type:'post'}   
        
        //nugu 관련 패스들  
        ,{file:'./nugu', path:'/Nugu/Assign_NuguName', method:'Assign_NuguName', type:'post'}
        //,{file:'./nugu', path:'/Nugu/Diary_Conversation', method:'Diary_Conversation', type:'post'}  
        ,{file:'./nugu', path:'/Nugu/First_Answer', method:'First_Answer', type:'post'}
        ,{file:'./nugu', path:'/Nugu/Second_Answer', method:'Second_Answer', type:'post'}

],      
};  

