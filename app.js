//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

require('dotenv').config()

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL, () => {
  console.log("Connected to MongoDB");
});

const itemsSchema = {
  name: String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItem = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
}

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, (err, foundItems) => {
    if (err) throw err;
    if (foundItems.lenght === 0) {
      Item.insertMany(defaultItem, (err) => {
        if(err) throw err;
        console.log("Default items already insert!");
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today", 
        newListItems: foundItems
      });
    }
  })

});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (err) throw err;
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItem
      })
    
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundList.name, 
        newListItems: foundList.items
      });
    }
  });
});




app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (err) throw err;
      console.log("Successfully delete checked item.");
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err){
      if (err) throw err;
      console.log("Successfully delete checked item.");
      res.redirect("/" + listName);
    });
  }


}); 

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
