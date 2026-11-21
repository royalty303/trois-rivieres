s=open('app.html').read()
s=s.replace('/*LEAFLET_CSS*/',open('leaflet.css').read()).replace('/*LEAFLET_JS*/',open('leaflet.js').read()).replace('/*DATA_JS*/',open('data.js').read()).replace('/*APP_JS*/',open('app.js').read())
open('../index.html','w').write(s);print(len(s)//1000,'KB')
