(function(){
 "use strict";
 const SUPABASE_URL="https://qmoxfzgiwamblpouxitn.supabase.co";
 const SUPABASE_PUBLISHABLE_KEY="sb_publishable_dsVQ5-5VuIG5n_m0qqNjqw__i5sogpL";
 let client=null;
 function getClient(){
  if(client)return client;
  if(!window.supabase||typeof window.supabase.createClient!=="function")throw new Error("Supabase client library did not load.");
  client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  return client;
 }
 async function getSession(){
  try{
   const c=getClient();
   const {data,error}=await c.auth.getSession();
   if(error)throw error;
   if(!data.session)return {session:null,user:null,error:null};
   const {data:verified,error:verifyError}=await c.auth.getUser(data.session.access_token);
   if(verifyError)throw verifyError;
   return {session:data.session,user:verified.user||null,error:null};
  }catch(error){return {session:null,user:null,error};}
 }
 async function requireSession(){
  const result=await getSession();
  return result;
 }
 async function signOut(){
  try{const {error}=await getClient().auth.signOut();if(error)throw error;return {ok:true,error:null};}
  catch(error){return {ok:false,error};}
 }
 async function getAccessProfile(session){
  if(!session||!session.access_token)throw new Error("A valid signed-in session is required.");
  const response=await fetch(SUPABASE_URL+"/functions/v1/shif-a-access",{method:"GET",headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:"Bearer "+session.access_token}});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload.error||"Access profile could not be loaded.");
  return payload;
 }
 async function getGrowthAnalytics(session){
  if(!session||!session.access_token)throw new Error("A verified Owner session is required.");
  const response=await fetch(SUPABASE_URL+"/functions/v1/shif-a-growth-analytics",{
   method:"GET",
   headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:"Bearer "+session.access_token}
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload.error||"Growth analytics could not be loaded.");
  return payload;
 }
 function getDisplayAccess(user){
  const meta=user&&user.app_metadata&&typeof user.app_metadata==="object"?user.app_metadata:{};
  const role=["owner","invited","customer"].includes(meta.shif_role)?meta.shif_role:"unassigned";
  const access=Array.isArray(meta.shif_access)?meta.shif_access.filter(x=>typeof x==="string"):[];
  return {role,access,unlimitedPlatformCredits:role==="owner"||role==="invited"};
 }
 window.ShifAAuth=Object.freeze({getSession,requireSession,signOut,getDisplayAccess,getAccessProfile,getGrowthAnalytics});
})();