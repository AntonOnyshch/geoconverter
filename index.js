class WorldCoordsConverter {
    a = 6378137.0;
    e2 = 6.6943799901377997e-3;
    a1 = 4.2697672707157535e+4;  //a1 = a*e2
    a2 = 1.8230912546075455e+9;  //a2 = a1*a1
    a3 = 1.4291722289812413e+2;  //a3 = a1*e2/2
    a4 = 4.5577281365188637e+9;  //a4 = 2.5*a2
    a5 = 4.2840589930055659e+4;  //a5 = a1+a3
    a6 = 9.9330562000986220e-1;  //a6 = 1-e2

    ECEFToGeodetic(x = 0, y = 0, z = 0) {
        const geo = new Array(3);   //Results go here (Lat, Lon, Altitude)

        const zp = Math.abs( z );
        const w2 = x*x + y*y;
        const w = Math.sqrt( w2 );
        const r2 = w2 + z*z;
        const r = Math.sqrt( r2 );
        geo[1] = Math.atan2( y, x );       //Lon (final)
        const s2 = z*z/r2;
        const c2 = w2/r2;
        let u = this.a2/r;
        let v = this.a3 - this.a4/r;

        let s, ss, c;

        if( c2 > 0.3 ){
            s = ( zp/r )*( 1.0 + c2*( this.a1 + u + s2*v )/r );
            geo[0] = Math.asin( s );      //Lat
            ss = s*s;
            c = Math.sqrt( 1.0 - ss );
        }
        else{
            c = ( w/r )*( 1.0 - s2*( this.a5 - u - c2*v )/r );
            geo[0] = Math.acos( c );      //Lat
            ss = 1.0 - c*c;
            s = Math.sqrt( ss );
        }
        const g = 1.0 - this.e2*ss;
        const rg = this.a/Math.sqrt( g );
        const rf = this.a6*rg;
        u = w - rg*c;
        v = zp - rf*s;z
        const f = c*u + s*v;
        const m = c*v - s*u;
        const p = m/( rf/g + f );
        geo[0] = geo[0] + p;      //Lat
        geo[2] = f + m*p/2.0;     //Altitude
        if( z < 0.0 ){
            geo[0] *= -1.0;     //Lat
        }
        return( geo );    //Return Lat, Lon, Altitude in that order
    }

    GeodeticToECEF (lat = 0, lon = 0, alt = 0) {
        const ecef = new Int32Array(3);  //Results go here (x, y, z)

        const n = this.a/Math.sqrt( 1 - this.e2*Math.sin( lat )*Math.sin( lat ) );
        ecef[0] = ( n + alt )*Math.cos( lat )*Math.cos( lon );    //ECEF x
        ecef[1] = ( n + alt )*Math.cos( lat )*Math.sin( lon );    //ECEF y
        ecef[2] = ( n*(1 - this.e2 ) + alt )*Math.sin( lat );          //ECEF z

        return ecef;     //Return x, y, z in ECEF
    }
}

window.geoconverter = {
    fromIndex: 0,
    toIndex: 0,
    converter: new WorldCoordsConverter(),
    init: function() {
        const cvtBody = document.getElementById('cvt-body');
        const settingsBtn = document.getElementById('settings-btn');
        const cvtSettings = document.getElementById('cvt-settings');
        const selectFrom = document.getElementById('select-from');
        const selectTo = document.getElementById('select-to');
        const cvtBodyRawClass = 'cvt-body-raw';
        const cvtBodyRawReverseClass = 'cvt-body-raw-reverse';
        selectFrom.addEventListener('change', (e) => {
            this.fromIndex = e.target.selectedIndex;
            if(this.fromIndex === 0) {
                selectTo.selectedIndex = 1;

                cvtBody.classList.remove(cvtBodyRawReverseClass);
                cvtBody.classList.add(cvtBodyRawClass);
            } else {
                selectTo.selectedIndex = 0;

                cvtBody.classList.remove(cvtBodyRawClass);
                cvtBody.classList.add(cvtBodyRawReverseClass);
            }
        });
        selectTo.addEventListener('change', (e) => {
            this.toIndex = e.target.selectedIndex;
            if(this.toIndex === 0) {
                selectFrom.selectedIndex = 1;

                cvtBody.classList.remove(cvtBodyRawClass);
                cvtBody.classList.add(cvtBodyRawReverseClass);
            } else {
                selectFrom.selectedIndex = 0;

                cvtBody.classList.remove(cvtBodyRawReverseClass);
                cvtBody.classList.add(cvtBodyRawClass);
            }
        });
        settingsBtn.addEventListener('click', (e) => {
            if(cvtSettings.style.display === 'flex') {
                cvtSettings.style.display = 'none';
            } else {
                cvtSettings.style.display = 'flex';
            }
        });
        document.getElementById('cvt-btn').addEventListener('click', (e) => {
            this.convert();
        });
    },
    convert: function() {
        const geoInputs = document.getElementById('geodetic-ctn').children;
        const ecefInputs = document.getElementById('ecef-ctn').children;
        const useDegrees = document.getElementById('degreesType').checked;
        const useMeters = document.getElementById('metersType').checked;
        const values = new Array(3);

        if(this.fromIndex === 0) {
            values[0] = parseFloat(geoInputs[1].value);
            values[1] = parseFloat(geoInputs[3].value);
            values[2] = parseFloat(geoInputs[5].value);
            let ecefCoords;
            // use degrees
            if(useDegrees) {
                const latD = values[0] * Math.PI / 180;
                const lonD = values[1] * Math.PI / 180;
                const alt = values[2];
                ecefCoords =  this.converter.GeodeticToECEF(latD, lonD, alt);
            } else { // use radians
                ecefCoords =  this.converter.GeodeticToECEF(values[0], values[1], values[2]);
            }
            if(useMeters) {
                ecefInputs[1].value = ecefCoords[0];
                ecefInputs[3].value = ecefCoords[1];
                ecefInputs[5].value = ecefCoords[2];
            } else {
                ecefInputs[1].value = ecefCoords[0] / 1000;
                ecefInputs[3].value = ecefCoords[1] / 1000;
                ecefInputs[5].value = ecefCoords[2] / 1000;
            }

        } else {
            values[0] = parseFloat(ecefInputs[1].value);
            values[1] = parseFloat(ecefInputs[3].value);
            values[2] = parseFloat(ecefInputs[5].value);
            let geodeticCoords;
            if(useMeters) {
                geodeticCoords = this.converter.ECEFToGeodetic(values[0], values[1], values[2]);
            } else {
                const xKm = values[0] / 1000;
                const yKm = values[1] / 1000;
                const zKm = values[2] / 1000;
                geodeticCoords = this.converter.ECEFToGeodetic(xKm, yKm, zKm);
            }

            if(useDegrees) {
                geoInputs[1].value = geodeticCoords[0] * 180 / Math.PI;
                geoInputs[3].value = geodeticCoords[1] * 180 / Math.PI;
                geoInputs[5].value = geodeticCoords[2];
            } else {
                geoInputs[1].value = geodeticCoords[0];
                geoInputs[3].value = geodeticCoords[1];
                geoInputs[5].value = geodeticCoords[2];
            }

        }
    },
}

window.geoconverter.init();
