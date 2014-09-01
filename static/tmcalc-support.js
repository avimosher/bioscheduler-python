var NEB = {};
NEB.trim = function (str) {
    return str.replace(/^\s+|\s+$/g, '');
};
NEB.revcomp = function (nucseq) {
    var fwd = "ACGTUKMSWRYBDHVNacgtukmswrybdhvn",
        rev = "TGCAAMKWSYRVHDBNtgcaamkwsyrvhdbn",
        bases = nucseq.split('').reverse(),
        i, j;
    for (i = 0; i < bases.length; ++i) {
        j = fwd.indexOf(bases[i]);
        if (j === -1) {
            throw {
                name: 'InvalidCharacter',
                message: 'A non IUPAC base was encountered'
            };
        } else {
            bases[i] = rev.charAt(j);
        }
    }
    return bases.join('');
};
NEB.createTmCalc = function (spec) {
    var that = this;
    alert(spec.seq);
    if (!spec.seq) {
        throw {
            name: 'Missing seq',
            message: 'A property named seq must be present in the object provided to createTmCalc'
        };
    }
    var seq = spec.seq,
        ct = spec.ct || 0.25,
        salt = spec.salt || 50.0,
        dmso = spec.dmso || 0.0,
        method = spec.method || 1,
        wseq = NEB.trim(seq.toLowerCase()).replace(/\s/g, ''),
        cseq = NEB.revcomp(wseq),
        sym, primerc, saltc, R = 1.987,
        dSBr = {
            'aa': -24.0,
            'tt': -24.0,
            'at': -23.9,
            'ta': -16.9,
            'ca': -12.9,
            'tg': -12.9,
            'gt': -17.3,
            'ac': -17.3,
            'ct': -20.8,
            'ag': -20.8,
            'ga': -13.5,
            'tc': -13.5,
            'cg': -27.8,
            'gc': -26.7,
            'gg': -26.6,
            'cc': -26.6
        }, dSSa = {
            'aa': -22.2,
            'tt': -22.2,
            'at': -20.4,
            'ta': -21.3,
            'ca': -22.7,
            'tg': -22.7,
            'gt': -22.4,
            'ac': -22.4,
            'ct': -21.0,
            'ag': -21.0,
            'ga': -22.2,
            'tc': -22.2,
            'cg': -27.2,
            'gc': -24.4,
            'gg': -19.9,
            'cc': -19.9
        }, dHBr = {
            'aa': -9.1,
            'tt': -9.1,
            'at': -8.6,
            'ta': -6.0,
            'ca': -5.8,
            'tg': -5.8,
            'gt': -6.5,
            'ac': -6.5,
            'ct': -7.8,
            'ag': -7.8,
            'ga': -5.6,
            'tc': -5.6,
            'cg': -11.9,
            'gc': -11.1,
            'gg': -11.0,
            'cc': -11.0
        }, dHSa = {
            'aa': -7.9,
            'tt': -7.9,
            'at': -7.2,
            'ta': -7.2,
            'ca': -8.5,
            'tg': -8.5,
            'gt': -8.4,
            'ac': -8.4,
            'ct': -7.8,
            'ag': -7.8,
            'ga': -8.2,
            'tc': -8.2,
            'cg': -10.6,
            'gc': -9.8,
            'gg': -8.0,
            'cc': -8.0
        }, gc_cnt = 0,
        fgc, sc_sch, sc_sl, sc_ow, i, j;
    sym = (wseq === cseq) ? true : false;
    primerc = ct / (sym ? 1 : 4) * 1e-6;
    saltc = salt * 1e-3;
    for (i = 0; i < wseq.length; ++i) {
        if (wseq.charAt(i) === 'g' || wseq.charAt(i) === 'c') {
            gc_cnt += 1;
        }
    }
    fgc = gc_cnt / wseq.length;
    sc_sch = 16.6 * Math.log(saltc) / Math.LN10;
    sc_sl = 0.368 * wseq.length * Math.log(saltc);
    sc_ow = (((4.29 * fgc) - 3.95) * 1e-5 * Math.log(saltc) + 9.4e-6 * Math.log(saltc) * Math.log(saltc));
    var saltCorrect = function () {
        this.sc_sch = 16.6 * Math.log(this.saltc) / Math.LN10;
        this.sc_sl = 0.368 * this.wseq.length * Math.log(this.saltc);
        this.sc_ow = (((4.29 * this.fgc) - 3.95) * 1e-5 * Math.log(this.saltc) + 9.4e-6 * Math.log(this.saltc) * Math.log(this.saltc));
    };
    var setMethod = function (newMethod) {
        this.method = newMethod;
        return this;
    };
    var setSeq = function (newseq) {
        var i;
        this.seq = newseq;
        this.wseq = NEB.trim(this.seq.toLowerCase().replace(' ', ''));
        this.cseq = NEB.revcomp(this.wseq);
        this.sym = (this.wseq === this.cseq) ? true : false;
        this.gc_cnt = 0;
        for (i = 0; i < this.wseq.length; ++i) {
            if (this.wseq.charAt(i) === 'g' || this.wseq.charAt(i) === 'c') {
                this.gc_cnt += 1;
            }
        }
        this.fgc = this.gc_cnt / this.wseq.length;
        this.saltCorrect();
        return this;
    };
    var setCt = function (newCt) {
        this.ct = newCt;
        this.primerc = this.ct / (this.sym ? 1 : 4) * 1e-6;
        return this;
    };
    var setSalt = function (newSalt) {
        this.salt = newSalt;
        this.saltc = this.salt * 1e-3;
        this.saltCorrect();
        return this;
    };
    var setDMSO = function (newDMSO) {
        this.dmso = newDMSO;
        return this;
    };
    var calcTm = function () {
        var tm = 0.0,
            ds = 0.0,
            dh = 0.0,
            dsinit = 0.0,
            dhinit = 0.0,
            dssym = 0.0,
            primerc_local = this.primerc,
            i, j, nn;
        switch (this.method) {
        case 1:
            dsinit += !this.sym ? -10.8 : -12.4;
            for (i = 0; i < this.wseq.length - 1; ++i) {
                nn = this.wseq.slice(i, i + 2);
                ds += this.dSBr[nn];
                dh += this.dHBr[nn];
            }
            dh *= 1000;
            tm = dh / (dsinit + ds + this.R * Math.log(primerc_local)) - 273.15 + this.sc_sch;
            break;
        case 3:
        case 4:
            dssym = !this.sym ? 0 : -1.4;
            if (this.wseq.charAt(0) === 'a' || this.wseq.charAt(0) === 't') {
                dsinit += 4.1;
                dhinit += 2300;
            }
            if (this.wseq.charAt(wseq.length - 1) === 'a' || this.wseq.charAt(this.wseq.length - 1) === 't') {
                dsinit += 4.1;
                dhinit += 2300;
            }
            if (this.wseq.charAt(0) === 'g' || this.wseq.charAt(0) === 'c') {
                dsinit += -2.8;
                dhinit += 100;
            }
            if (this.wseq.charAt(wseq.length - 1) === 'g' || this.wseq.charAt(this.wseq.length - 1) === 'c') {
                dsinit += -2.8;
                dhinit += 100;
            }
            for (i = 0; i < this.wseq.length - 1; i++) {
                nn = this.wseq.slice(i, i + 2);
                ds += this.dSSa[nn];
                dh += this.dHSa[nn];
            }
            dh *= 1000;
            tm = (dh + dhinit) / (dsinit + dssym + ds + this.R * Math.log(primerc_local));
            if (this.method === 3) {
                tm = 1.0 / ((1.0 / tm) + (this.sc_sl / (dh + dhinit)));
            } else if (this.method === 4) {
                tm = 1.0 / ((1.0 / tm) + this.sc_ow);
            }
            tm -= 273.15;
            break;
        case 7:
            tm = 81.5 + 16.6 * Math.log(this.saltc) / Math.LN10 + 0.41 * this.fgc - 675 / this.wseq.length;
            break;
        }
        tm = tm - (this.dmso * 0.6);
        return {
            'method': this.method,
            'wseq': this.wseq,
            'tm': tm,
            'dh': dh,
            'ds': ds,
            'salt': this.saltc,
            'ct': this.primerc,
            'dmso': this.dmso
        };
    };
    return {
        'setSeq': setSeq,
        'setSalt': setSalt,
        'setCt': setCt,
        'setDMSO': setDMSO,
        'setMethod': setMethod,
        'saltCorrect': saltCorrect,
        'Tm': calcTm,
        'gc_cnt': gc_cnt,
        'fgc': fgc,
        'sc_sch': sc_sch,
        'sc_sl': sc_sl,
        'sc_ow': sc_ow,
        'seq': seq,
        'ct': ct,
        'salt': salt,
        'dmso': dmso,
        'method': method,
        'wseq': wseq,
        'cseq': cseq,
        'sym': sym,
        'primerc': primerc,
        'saltc': saltc,
        'R': R,
        'dSSa': dSSa,
        'dHSa': dHSa,
        'dSBr': dSBr,
        'dHBr': dHBr
    };
};
NEB.isValidSeq = function (seq, extended) {
    var strictAlphabet = " acgt";
    strictAlphabet += strictAlphabet.toUpperCase();
    var extendedAlphabet = " acgtwsrymkbdhvn";
    extendedAlphabet += extendedAlphabet.toUpperCase();
    var alpha, pos;
    if (extended === false) {
        alpha = strictAlphabet;
    } else {
        alpha = extendedAlphabet;
    }
    for (pos = 0; pos < seq.length; ++pos) {
        if (alpha.indexOf(seq.charAt(pos)) === -1) {
            return false;
        }
    }
    return true;
};
NEB.dmsg = function (msg) {
    if (typeof console !== "undefined" && typeof console.log === "function") {
        console.log(msg);
    }
};
if (typeof exports !== "undefined") {
    for (var f in NEB) {
        exports[f] = NEB[f];
    }
}