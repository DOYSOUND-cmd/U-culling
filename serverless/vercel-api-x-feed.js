
export default async function handler(req, res){
  try{
    const { user = 'UcullingHQ' } = req.query;
    const token = process.env.X_BEARER_TOKEN;
    if(!token) return res.status(500).json({error:'Missing X_BEARER_TOKEN'});
    const headers = { 'Authorization': `Bearer ${token}` };
    const u = await fetch(`https://api.twitter.com/2/users/by/username/${user}`, { headers });
    const uj = await u.json();
    const id = uj?.data?.id;
    if(!id) return res.status(404).json({error:'user not found', raw:uj});
    const params = new URLSearchParams({
      'max_results':'10',
      'exclude':'retweets,replies',
      'tweet.fields':'created_at,entities,public_metrics,referenced_tweets',
      'expansions':'attachments.media_keys,author_id',
      'media.fields':'preview_image_url,url'
    });
    const tw = await fetch(`https://api.twitter.com/2/users/${id}/tweets?`+params.toString(), { headers });
    const tj = await tw.json();
    res.setHeader('Cache-Control','no-store'); 
    return res.status(200).json(tj);
  }catch(e){
    console.error(e);
    return res.status(500).json({error:String(e)});
  }
}
