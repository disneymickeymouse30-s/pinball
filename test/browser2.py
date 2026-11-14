import asyncio
from playwright.async_api import async_playwright
URL='http://localhost:8765/index.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--enable-precise-memory-info'])
        ctx=await b.new_context(viewport={'width':360,'height':640},device_scale_factor=3,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]
        pg.on('console',lambda m: errs.append(m.text) if m.type in('error','warning') else None)
        pg.on('pageerror',lambda e: errs.append('PAGEERROR '+str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        print('sw',await pg.evaluate("navigator.serviceWorker.ready.then(r=>!!r.active)"))
        await pg.evaluate("PP.Save.data.tutorialDone=true")
        await pg.screenshot(path='test/shots/a_title360.png')
        await pg.tap('[data-act=start]'); await pg.wait_for_timeout(400)
        # 何もしないでゲームオーバーまで早送り → リザルト → もう一度
        r=await pg.evaluate('''(()=>{const A=PP_TEST.App;A.stop();const g=A.g;let n=0;while(!g.over&&n<200000){if(g.phase==='ready')g.launch(0.5);g.update(1/60);n++;}A.run();return {frames:n,score:g.score,left:g.ballsLeft}})()''')
        print('no-flip game',r)
        await pg.wait_for_timeout(2200); await pg.screenshot(path='test/shots/b_result360.png')
        print('result shown',await pg.evaluate("PP.UI.cur"))
        await pg.tap('[data-act=again]'); await pg.wait_for_timeout(500)
        print('after again: ui',await pg.evaluate("PP.UI.cur"),'phase',await pg.evaluate("PP_TEST.App.g.phase"),'over',await pg.evaluate("PP_TEST.App.g.over"))
        await pg.touchscreen.tap(60,500); 
        # 連続プレイのメモリ確認（各ステージを早送りで回す）
        mem=[]
        for rnd in range(3):
            await pg.evaluate('''(()=>{const A=PP_TEST.App;for(let k=0;k<22;k++){A.start(1+k%11);A.stop();const g=A.g;let n=0,h=0;while(!g.over&&n<9000){if(g.phase==='ready')g.launch(0.7);for(let i=0;i<2;i++){let w=false;for(const b of g.balls){if(b.held||b.inShooter)continue;const inX=i===0?(b.x>95&&b.x<185):(b.x>185&&b.x<275);if(inX&&b.y>605&&b.y<672&&b.vy>-150)w=true;}g.setFlip(i,w&&(n%27<10));}g.update(1/60);if(n%3===0)PP_TEST.rend.draw(1/20);n++;}A.finish(false);}})()''')
            await pg.evaluate("window.gc&&gc()"); await pg.wait_for_timeout(500)
            mem.append(await pg.evaluate("Math.round(performance.memory.usedJSHeapSize/1048576)"))
        print('heap MB after 22/44/66 games',mem)
        print('save',await pg.evaluate("JSON.stringify({plays:PP.Save.data.plays,lv:PP.Save.data.level,bow:PP.Save.data.bow,cleared:Object.keys(PP.Save.data.cleared),ach:Object.keys(PP.Save.data.ach).length,pugs:PP.Save.data.pugs,unl:PP.Save.data.unlocked})"))
        # 再読み込みして保存が残るか + オフライン起動
        await ctx.set_offline(True); await pg.reload(); await pg.wait_for_timeout(1200)
        print('offline reload ok',await pg.evaluate("!!window.PP&&PP.UI.cur"),'plays kept',await pg.evaluate("PP.Save.data.plays"))
        await pg.screenshot(path='test/shots/c_offline.png'); await ctx.set_offline(False)
        await pg.evaluate("PP.Save.data.bow=9999;PP.UI.show('collection')"); await pg.wait_for_timeout(300)
        await pg.tap('[data-cat=pug][data-v=black]'); await pg.wait_for_timeout(200); await pg.tap('#modal [data-m="1"]'); await pg.wait_for_timeout(300)
        print('bought black:',await pg.evaluate("PP.Save.data.pugs.includes('black')&&PP.Save.data.pug==='black'&&PP.Save.data.bow"))
        await pg.screenshot(path='test/shots/d_collection.png')
        print('ERR',len(errs),errs[:8])
        # PC横長・1ファイル版
        pc=await b.new_context(viewport={'width':1280,'height':720}); p2=await pc.new_page(); e2=[]
        p2.on('pageerror',lambda e: e2.append(str(e))); p2.on('console',lambda m: e2.append(m.text) if m.type=='error' else None)
        await p2.goto('http://localhost:8765/dist/pug-pinball-world.html'); await p2.wait_for_timeout(600)
        await p2.evaluate("PP.Save.data.tutorialDone=true"); await p2.click('[data-act=start]'); await p2.wait_for_timeout(300)
        await p2.keyboard.down(' '); await p2.wait_for_timeout(500); await p2.keyboard.up(' '); await p2.wait_for_timeout(1500)
        await p2.keyboard.down('ArrowLeft'); await p2.wait_for_timeout(100)
        print('pc: phase',await p2.evaluate("PP_TEST.App.g.phase"),'leftflip',await p2.evaluate("PP_TEST.App.g.flips[0].on"))
        await p2.screenshot(path='test/shots/e_pc.png'); print('ERR single-file',e2[:5])
        await b.close()
asyncio.run(main())
