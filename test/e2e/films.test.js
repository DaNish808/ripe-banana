const request = require('./request');
const {assert} = require('chai');
const mongoose = require('mongoose');

describe('films router', () => {

    let studios = null;
    let actors = null;
    let filmData = null;

    beforeEach(() => {
        mongoose.connection.dropDatabase();

        const studioData = [
            {
                name: 'Touchstone Studio',
                address: {
                    city: 'Portland',
                    state: 'New Zealand',
                    country: 'Mars'
                }
            },
            {
                name: 'Time Warner',
                address: {
                    city: 'Burbank',
                    state: 'Cali',
                    country: 'USA! USA!'
                }
            },      
            {
                name: 'Paramount',
                address: {
                    city: 'paris',
                    state: 'Paris',
                    country: 'PARIS'
                }
            }
        ];
        const actorData = [
            {
                name: 'Steven',
                dob: new Date('2017-10-20'),
                pob: '30th NW 10th Ave, Portland, Oregon 97209'

            },
            {
                name: 'Oprah'
            },
            {
                name: 'Tom Cruise',
                dob: new Date('1000-0-0'),
                pob: 'Kolob'
            }
        ];

        const saveAllPromises = studioData.concat(actorData).map(dataObj => {
            return request
                .post(`/api/${dataObj.dob ? 'actors' : 'studios'}`)
                .send(dataObj);
        });
        
        return Promise.all(saveAllPromises)
            .then(res => {

                studios = res.slice(0, studioData.length).map(r => r.body);
                actors = res.slice( -actorData.length).map(r => r.body);

                filmData = [
                    {
                        title: 'Halloween',
                        studio: studios[0]._id,
                        released: 2000,
                        cast: [
                            {
                                part: 'damsel in distress',
                                actor: actors[0]._id
                            },
                            {
                                part: 'lead',
                                actor: actors[1]._id
                            }
                        ]
                    },
                    {
                        title: 'Blade Runner',
                        studio: studios[1]._id,
                        released: 2017,
                        cast: [
                            {
                                part: 'android',
                                actor: actors[2]._id
                            },
                            {
                                part: 'human',
                                actor: actors[1]._id
                            }
                        ]
                    }
                ]
            });
    });

    describe('CRUD', () => {
        describe('post', () => {
            it('returns the saved object with its new mongo id', () => {
                return request.post('/api/films')
                    .send(filmData[0])
                    .then(res => {
                        const saved = res.body;
                        filmData[0]._id = saved._id;
                        filmData[0].__v = 0;

                        assert.deepEqual(saved, filmData[0]);
                        assert.ok(saved !== filmData[0]);
                    })
            });
        });

        describe('get all', () => {
            it('retrieves an array holding the title, date released, and studio name of all films', () => {
                const saveAll = filmData.map(film => {
                    return request.post('/api/films').send(film);
                });

                return Promise.all(saveAll)
                    .then(postRes => {
                        const saved = postRes.map(res => res.body);

                        // set up expected array
                        const expected = saved.map(film => {

                            // replace studio id with its name
                            studios.forEach(studioInDB => {
                                if(studioInDB._id === film.studio) film.studio = studioInDB.name;
                            });

                            // remove irrelevant data
                            delete film.cast;
                            delete film.__v;

                            return film;
                        });

                        return request.get('/api/films')
                            .then(getRes => {
                                const allStudios = getRes.body;

                                expected.forEach(studio => {
                                    assert.deepInclude(allStudios, studio);
                                })
                            })
                    })
            })
        });

        // describe('get by id', () => {   // TODO: also get review stuff
        //     it('retrieves the title, released date, studio name, cast( including actor\'s name and role', () => {
        //         return request.post('/api/films')
        //             .send(filmData[1])
        //             .then(postRes => {
        //                 const saved = postRes.body;
        //                 return request.get('/api/films')
        //                     .then(getRes => {

        //                     })
        //             })
        //     })
        // });
    });

});