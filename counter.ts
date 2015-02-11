/// <reference path="typings/tsd.d.ts" />

import _ = require('lodash');

export interface Counter{
    inc():void;
    add(value: number):void;
    getValues(): number[];
}

var counters: { [name: string]: Counter } = {};
var _beforeRollover;

export function beforeRollover(x){
    _beforeRollover=x;
}

export var defaultInfervals =  [1,5,15,60,120,240,1440];

class CounterImpl implements Counter{

    private values:number[]=[];
     current=0;

    constructor(){
    }

    private rollover(mins:number){

        this.values.push(this.current);
        if ( this.values.length > 1440 ){
            this.values.shift();
        }

        this.current=0;
      }

   inc():void{
        this.add(1);
    }

    add(value:number):void{
        this.current+= value;
    }

    getValues(intervals?:number[]): number[] {
        var intv =   intervals || defaultInfervals;

        return intv.map(v=> _.takeRight(this.values,v).reduce((x,y)=>x+y,0));
    }


    static startup=function() {
        var minutes = 0;
        setInterval(() => {

            minutes++;
            _.values(counters).map((y) => y.rollover(minutes));
            _beforeRollover(CounterImpl.getCounters());

        }, 60000);
    }();

    static getCounter(name){
        return counters[name] || (counters[name]=new CounterImpl);
    }

    static getCounters(): { [name: string]: Counter } {
        return _.clone(counters);
    }
}

export function getCounter(name:string ) : Counter {

    return CounterImpl.getCounter(name);
}

export function getCounters() {
    return CounterImpl.getCounters();
}