
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const user = url.searchParams.get('user') || 'UcullingHQ';
    const token = env.X_BEARER_TOKEN;
    if (!token) return new Response(JSON.stringify({error:'Missing X_BEARER_TOKEN'}), {status:500, headers:{'content-type':'application/json'}});
    const headers = { 'Authorization': `Bearer ${token}` };

    // 1) username -> id
    let r = await fetch(`https://api.twitter.com/2/users/by/username/${user}`, { headers });
    let j = await r.json();
    const id = j?.data?.id;
    if(!id) return new Response(JSON.stringify({error:'user not found', raw:j}), {status:404, headers:{'content-type':'application/json'}});

    // 2) user tweets
    const params = new URLSearchParams({
      'max_results':'10',
      'exclude':'retweets,replies',
      'tweet.fields':'created_at,entities,public_metrics,referenced_tweets',
      'expansions':'attachments.media_keys,author_id',
      'media.fields':'preview_image_url,url'
    });
    r = await fetch(`https://api.twitter.com/2/users/${id}/tweets?`+params.toString(), { headers });
    j = await r.json();
    return new Response(JSON.stringify(j), { headers: { 'content-type': 'application/json', 'cache-control':'no-store' } });
  }
}
