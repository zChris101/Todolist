const express = require('express');
const http = require('node:http');
const bodyParser = require('body-parser');
const { Console } = require('node:console');
const date = require(__dirname + '/date.js');
const mongoose = require('mongoose');
var  _ =require('lodash');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');


//atlas
//app.use('todolistDB');

//mongodb



main().catch(err => console.log(err));


async function main() {

    //creating or connecting to the local database called todolistDB
    await mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');

    //Schema 
    const itemSchema = new mongoose.Schema({
        name: String
    })

    const listSchema = new mongoose.Schema({
        name : String ,
        items : [itemSchema]
    })

    //Model initialization
    const Item = mongoose.model('Item', itemSchema);
    const List = mongoose.model('List',listSchema);

    //initial items to insert into our todolist page
    const item1 = new Item({
        name: 'Welcome to your todolist!'
    });

    const item2 = new Item({
        name: 'Hit the + button to add a new item.'
    });

    const item3 = new Item({
        name: '<--Hit this to delete an item.'
    });
    
    const defaultItems = [item1, item2, item3];

    //initian page
    app.get("/", async (req, res) => {

        //finding if the 'Item' model db is empty if so insert its initial items.
        if ((await Item.find({})).length === 0) {
            Item.insertMany(defaultItems);
            console.log('Successfully inserted items into DB')
        }

        //getting all the items into the DB
        let founditems = await Item.find({});

        
        res.sendFile(__dirname + 'views/list.ejs');
        
       //rendering list and displaying it into the "/" page.
        res.render('list', {
            listTitle: 'Today',
            newListItems: founditems
        });

    }) 
 
    //for more customize page ex. /Work ,/Home , /School and .etc
    app.get("/:customListName", async(req,res)=>{

        const customListName = _.capitalize(req.params.customListName);


        // first, getting and finding the name of the page if it exist
        // second, if not exist, create a page with its name and insert defaultitems
        // third, if exist render the page and show its content
        await List.findOne({name : customListName})
            .then((foundList,err)=>{
                if(!err){
                    if(!foundList){
                         
                        const list = new List({
                            name : customListName,
                            items :  defaultItems
                        });

                        list.save();

                        res.redirect("/" + customListName);

                    } else {
                      
                        console.log(foundList);
                        res.render('list',{
                            listTitle: foundList.name,
                            newListItems: foundList.items
                        })
                    }
                }
            })                                                                                                         
            

        
    });


    
    //adding new items to the page
    app.post("/", async (req, res) => {


        const itemName = req.body.newItem;
        const listName =req.body.list;

        const item = new Item({
            name: itemName
        })
        

        //if listname is Today it just means its in the "/" page 
        //then save the string into the 'items' section under the 'name' of an array
        //it will be save in 'items' collection in db
        //else, it will search for the page name then push and save that string into the database
        //and redirect to its name
        if (listName==="Today"){
            item.save();
            res.redirect("/")
        } else {
            await List.findOne({name: listName})
                .then((foundList)=>{
                    foundList.items.push(item);
                    foundList.save();
                    res.redirect("/"+ listName);
                    
                })
        }

       
    })

    //deleting items in the list
    app.post("/delete", async (req, res) => {

        const checkedItemId = req.body.checkbox;
        const listName = req.body.listName;


        //delete string associate with id by checking into the checkbox
        //first it will check if the page has the name 'Today'
        //then find and remove using its id
        //else, delete string by finding and update with mongodb command 'pull'
        //then redirect to its current page with then updated page
        if (listName === 'Today'){

            Item.findByIdAndRemove(checkedItemId).then(() => { console.log('Success of removing an item') });
            // console.log(req.body.checkbox);
            res.redirect("/");

        } else {
            List.findOneAndUpdate({name: listName},{$pull: {items : {_id : checkedItemId}}})
            .then((foundlist , err )=>{
                if(!err){
                    res.redirect("/" + listName);
                }
            })
        }

        
    })



    app.listen(3000, () => {
        console.log("The Site is running at port 3000");
    })
    //end of async function main
}




