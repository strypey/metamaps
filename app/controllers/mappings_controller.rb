class MappingsController < ApplicationController
  respond_to :js, :html

  # GET mappings
  def index
  end

  # GET mappings/new
  def new
    @mapping = Mapping.new
    @user = current_user
    respond_with(@mapping)
  end

  # POST mappings
  def create
    @mapping = Mapping.new()

    //TODO authenticate and put a user

    @mapping.xloc = params[:xloc] if params[:xloc]
    @mapping.yloc = params[:yloc] if params[:yloc]

    if params[:map]
      if params[:map][:id]
        @map = Map.find(params[:map][:id])
        @mapping.map = @map
      end
    end
    if params[:topic]
      if params[:topic][:id]
        @topic = Topic.find(params[:topic][:id])
        @mapping.topic = @topic
        @mapping.category = "Topic"
      end
    elsif params[:synapse]
      if params[:synapse][:id]
        @topic = Synapse.find(params[:synapse][:id])
        @mapping.synapse = @synapse
        @mapping.category = "Synapse"
      end
    end
    @mapping.save()
  end

  # GET /mappings/:id
  def show
  end

  # GET /mappings/:id/edit
  def edit
  end

  # PUT /mappings/:id
  def update
  end

  # DELETE /mappings/:id
  def destroy
  end
end
