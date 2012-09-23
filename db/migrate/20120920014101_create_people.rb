class CreatePeople < ActiveRecord::Migration
  def change
    create_table :people do |t|
      t.text :name
      t.text :desc
	  t.text :city
	  t.text :province
	  t.text :country
      t.text :link
	  t.integer :user_id

      t.timestamps
    end
  end
end
